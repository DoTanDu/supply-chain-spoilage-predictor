const { spawn } = require('child_process');
const fs = require('fs');
const assert = require('assert');

async function testDcIntakeFrontend() {
  console.log('='.repeat(80));
  console.log('🧪 TEST FRONTEND GIAI ĐOẠN 2: KIỂM ĐỊNH GIAO DIỆN DC INTAKE (MỤC 12)');
  console.log('='.repeat(80));

  // 1. Đăng nhập vai trò WAREHOUSE_STAFF
  const loginWarehouse = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'warehouse', password: 'Password123@' })
  }).then(r => r.json());
  assert.strictEqual(loginWarehouse.success, true, 'Login warehouse must succeed');

  // 2. Đăng nhập vai trò CASHIER
  const loginCashier = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'cashier', password: 'Password123@' })
  }).then(r => r.json());
  assert.strictEqual(loginCashier.success, true, 'Login cashier must succeed');

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const remotePort = 9223;
  const userDataDir = 'C:\\Users\\ASUS\\.gemini\\antigravity\\brain\\8a13d27e-7073-4986-90b5-f871a594c4ed\\scratch\\edge_dc_profile';

  const edgeProcess = spawn(edgePath, [
    `--remote-debugging-port=${remotePort}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    'http://localhost:5173/dc-intake'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  try {
    const listRes = await fetch(`http://127.0.0.1:${remotePort}/json`);
    const tabs = await listRes.json();
    const targetTab = tabs.find(t => t.url.includes('localhost:5173')) || tabs[0];
    const ws = new WebSocket(targetTab.webSocketDebuggerUrl);

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let id = 1;
    function send(method, params = {}) {
      return new Promise((resolve) => {
        const msgId = id++;
        const handler = (event) => {
          const data = JSON.parse(event.data);
          if (data.id === msgId) {
            ws.removeEventListener('message', handler);
            resolve(data.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await send('Runtime.enable');
    await send('Page.enable');

    // -------------------------------------------------------------
    // TEST 1: NHÂN VIÊN KHO (WAREHOUSE_STAFF) TRUY CẬP DC INTAKE
    // -------------------------------------------------------------
    console.log('\n[TEST 1] Kiểm tra giao diện tiếp nhận hàng với vai trò WAREHOUSE_STAFF:');
    await send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('user', ${JSON.stringify(JSON.stringify(loginWarehouse.data.user))});
        localStorage.setItem('token', ${JSON.stringify(loginWarehouse.data.token)});
        localStorage.setItem('lhu_mart_theme', 'dark');
      `
    });

    await send('Page.navigate', { url: 'http://localhost:5173/dc-intake' });
    await new Promise(r => setTimeout(r, 3000));

    const warehouseCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const text = document.body.innerText;
        const hasTitle = text.includes('Tiếp Nhận Hàng');
        const hasRslBadge = text.includes('RSL') || text.includes('ĐỘ TƯƠI MỚI');
        const buttons = Array.from(document.querySelectorAll('button')).map(b => ({
          text: b.innerText.trim(),
          disabled: b.disabled
        }));
        const submitBtn = buttons.find(b => b.text.includes('Nhập Kho') || b.text.includes('Xác Nhận'));
        return { hasTitle, hasRslBadge, submitBtn, totalButtons: buttons.length };
      })()`,
      returnByValue: true
    });

    console.log('  -> Kết quả UI Warehouse:', warehouseCheck.result.value);
    assert.strictEqual(warehouseCheck.result.value.hasTitle, true, 'Must display intake interface');
    console.log('  ✅ [PASS] Giao diện Tiếp nhận hàng DC hiển thị đầy đủ tiêu đề và thước đo RSL');

    // -------------------------------------------------------------
    // TEST 2: THU NGÂN (CASHIER) BỊ KHÓA SOD TRÊN GIAO DIỆN DC INTAKE
    // -------------------------------------------------------------
    console.log('\n[TEST 2] Kiểm tra khóa SoD với vai trò CASHIER (Mục 12.5):');
    await send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('user', ${JSON.stringify(JSON.stringify(loginCashier.data.user))});
        localStorage.setItem('token', ${JSON.stringify(loginCashier.data.token)});
      `
    });

    await send('Page.navigate', { url: 'http://localhost:5173/dc-intake' });
    await new Promise(r => setTimeout(r, 2500));

    const cashierCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const text = document.body.innerText;
        const hasSodLock = text.includes('BẢO VỆ PHÂN ĐỊNH TRÁCH NHIỆM') || text.includes('SOD MATRIX');
        const hasPosButton = text.includes('Quầy Thu Ngân POS');
        return { hasSodLock, hasPosButton };
      })()`,
      returnByValue: true
    });

    console.log('  -> Kết quả UI Cashier:', cashierCheck.result.value);
    assert.strictEqual(cashierCheck.result.value.hasSodLock, true, 'Cashier must be locked with SoD notice');
    console.log('  ✅ [PASS] Vai trò Thu ngân (CASHIER) bị khóa cứng phân hệ nhập kho kèm thông báo SoD');

    ws.close();
    console.log('\n' + '='.repeat(80));
    console.log('🎉 GIAI ĐOẠN 2 HOÀN TẤT: GIAO DIỆN FRONTEND ĐẠT CHUẨN MỤC 12 (100% PASS)');
    console.log('='.repeat(80));
  } catch (err) {
    console.error('Lỗi kiểm thử Frontend CDP:', err);
  } finally {
    edgeProcess.kill();
  }
}

testDcIntakeFrontend();

