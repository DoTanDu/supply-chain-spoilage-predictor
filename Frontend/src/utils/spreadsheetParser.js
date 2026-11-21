// src/utils/spreadsheetParser.js
/**
 * Đọc file POS chuẩn hóa cả CSV (RFC-4180) lẫn Excel (.xlsx) thuần trên trình duyệt (không cần package ngoài).
 */

export function parseCsvRows(text) {
  const clean = String(text || '').replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    const next = clean[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell.trim());
      cell = '';
    } else if (ch === '\r' && next === '\n') {
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = '';
      i++;
    } else if (ch === '\n' || ch === '\r') {
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

async function inflateRawBytes(bytes) {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('Trình duyệt chưa hỗ trợ giải nén file .xlsx. Vui lòng dùng Chrome/Edge mới hoặc xuất sang .csv.');
  }
  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  writer.write(bytes);
  writer.close();
  const buf = await new Response(ds.readable).arrayBuffer();
  return new TextDecoder('utf-8').decode(buf);
}

function readZipEntriesFromCentralDirectory(buffer) {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  let eocdOffset = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65558); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) {
    throw new Error('File không đúng định dạng nén .xlsx hợp lệ.');
  }

  const totalEntries = view.getUint16(eocdOffset + 10, true);
  let cdOffset = view.getUint32(eocdOffset + 16, true);
  const entries = {};

  for (let idx = 0; idx < totalEntries; idx++) {
    if (view.getUint32(cdOffset, true) !== 0x02014b50) break;
    const method = view.getUint16(cdOffset + 10, true);
    const compSize = view.getUint32(cdOffset + 20, true);
    const nameLen = view.getUint16(cdOffset + 28, true);
    const extraLen = view.getUint16(cdOffset + 30, true);
    const commentLen = view.getUint16(cdOffset + 32, true);
    const localHeaderOffset = view.getUint32(cdOffset + 42, true);
    const name = new TextDecoder('utf-8').decode(bytes.subarray(cdOffset + 46, cdOffset + 46 + nameLen));

    if (name === 'xl/sharedStrings.xml' || /^xl\/worksheets\/sheet\d+\.xml$/i.test(name)) {
      const lhNameLen = view.getUint16(localHeaderOffset + 26, true);
      const lhExtraLen = view.getUint16(localHeaderOffset + 28, true);
      const dataStart = localHeaderOffset + 30 + lhNameLen + lhExtraLen;
      entries[name] = {
        method,
        data: bytes.subarray(dataStart, dataStart + compSize)
      };
    }
    cdOffset += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

function colRefToIndex(ref) {
  const letters = String(ref || '').replace(/\d+/g, '').toUpperCase();
  let col = 0;
  for (let i = 0; i < letters.length; i++) {
    col = col * 26 + (letters.charCodeAt(i) - 64);
  }
  return Math.max(0, col - 1);
}

function excelSerialToIsoDate(serial) {
  const num = Number(serial);
  if (!Number.isFinite(num) || num < 30000 || num > 80000) return String(serial);
  const utcDays = Math.floor(num - 25569);
  const d = new Date(utcDays * 86400 * 1000);
  return Number.isNaN(d.getTime()) ? String(serial) : d.toISOString().slice(0, 10);
}

export async function parseXlsxFirstSheet(arrayBuffer) {
  const entries = readZipEntriesFromCentralDirectory(arrayBuffer);
  const sheetKey = entries['xl/worksheets/sheet1.xml']
    ? 'xl/worksheets/sheet1.xml'
    : Object.keys(entries).find(k => /^xl\/worksheets\/sheet\d+\.xml$/i.test(k));

  if (!sheetKey) {
    throw new Error('Không tìm thấy sheet dữ liệu trong file Excel (.xlsx).');
  }

  const decodeEntry = async (entry) => {
    if (!entry) return '';
    if (entry.method === 0) return new TextDecoder('utf-8').decode(entry.data);
    if (entry.method === 8) return await inflateRawBytes(entry.data);
    throw new Error('Định dạng nén bên trong file .xlsx không được hỗ trợ.');
  };

  const parser = new DOMParser();
  const sharedStrings = [];
  if (entries['xl/sharedStrings.xml']) {
    const ssXml = await decodeEntry(entries['xl/sharedStrings.xml']);
    const ssDoc = parser.parseFromString(ssXml, 'application/xml');
    const siList = ssDoc.getElementsByTagName('si');
    for (let i = 0; i < siList.length; i++) {
      const tNodes = siList[i].getElementsByTagName('t');
      let txt = '';
      for (let j = 0; j < tNodes.length; j++) txt += tNodes[j].textContent || '';
      sharedStrings.push(txt);
    }
  }

  const sheetXml = await decodeEntry(entries[sheetKey]);
  const sheetDoc = parser.parseFromString(sheetXml, 'application/xml');
  const rowNodes = sheetDoc.getElementsByTagName('row');
  const rows = [];
  let dateCols = new Set();

  for (let r = 0; r < rowNodes.length; r++) {
    const cellNodes = rowNodes[r].getElementsByTagName('c');
    const rowArr = [];
    for (let c = 0; c < cellNodes.length; c++) {
      const cNode = cellNodes[c];
      const ref = cNode.getAttribute('r') || '';
      const colIdx = ref ? colRefToIndex(ref) : c;
      const cellType = cNode.getAttribute('t') || '';
      const vNode = cNode.getElementsByTagName('v')[0];
      const isNode = cNode.getElementsByTagName('is')[0];

      let val = '';
      if (cellType === 's' && vNode) {
        val = sharedStrings[Number(vNode.textContent)] ?? '';
      } else if (cellType === 'inlineStr' && isNode) {
        val = isNode.textContent || '';
      } else if (vNode) {
        const rawVal = vNode.textContent || '';
        const serialNum = Number(rawVal);
        const isHeuristicDateCol = dateCols.size === 0 && r > 0 && colIdx === 2 && serialNum >= 40000 && serialNum <= 60000;
        const isKnownDateCol = dateCols.has(colIdx) && serialNum >= 20000 && serialNum <= 80000;
        val = (isKnownDateCol || isHeuristicDateCol) && /^\d{5}(\.\d+)?$/.test(rawVal)
          ? excelSerialToIsoDate(rawVal)
          : rawVal;
      }
      rowArr[colIdx] = String(val).trim();
    }
    if (rowArr.some(Boolean)) {
      const denseRow = Array.from({ length: rowArr.length }, (_, i) => rowArr[i] || '');
      if (rows.length === 0) {
        denseRow.forEach((hdr, idx) => {
          if (/date|ngay/i.test(hdr)) dateCols.add(idx);
        });
      }
      rows.push(denseRow);
    }
  }
  return rows;
}

export async function parsePosSpreadsheetFile(file) {
  const name = String(file?.name || '').toLowerCase();
  if (name.endsWith('.xlsx')) {
    const buffer = await file.arrayBuffer();
    const rows = await parseXlsxFirstSheet(buffer);
    return { format: 'XLSX', rows };
  }
  const text = await file.text();
  return { format: 'CSV', rows: parseCsvRows(text) };
}
