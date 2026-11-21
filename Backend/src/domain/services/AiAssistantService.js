// src/domain/services/AiAssistantService.js
const SqlConnection = require('../../infrastructure/database/sqlConnection');
const { formatLocalDateYMD } = require('../utils/dateUtils');

let cachedGenAIClass = null;
async function getGoogleGenAIClass() {
  if (cachedGenAIClass) return cachedGenAIClass;
  try {
    const mod = require('@google/genai');
    cachedGenAIClass = mod.GoogleGenAI || mod.default?.GoogleGenAI || null;
    if (cachedGenAIClass) return cachedGenAIClass;
  } catch {
    // Fallback to dynamic ESM import if package is pure ESM
  }
  try {
    const mod = await import('@google/genai');
    cachedGenAIClass = mod.GoogleGenAI || mod.default?.GoogleGenAI || null;
  } catch {
    cachedGenAIClass = null;
  }
  return cachedGenAIClass;
}

class AiAssistantService {
  /**
   * Thu thập ngữ cảnh vận hành thực tế của chuỗi cửa hàng hoặc chi nhánh được phân quyền
   */
  async getLiveSystemContext(storeId = 'ALL') {
    try {
      const isAll = String(storeId || 'ALL').toUpperCase() === 'ALL' || !Number.isInteger(Number(storeId));
      const sid = isAll ? null : Number(storeId);

      const storeWhereBatch = isAll ? '1=1' : `ISNULL(b.store_id, 1) = ${sid}`;
      const storeWhereTransfer = isAll ? '1=1' : `(st.from_store_id = ${sid} OR st.to_store_id = ${sid})`;
      const storeWhereSpoilage = isAll ? '1=1' : `ISNULL(sr.store_id, 1) = ${sid}`;
      const todaySql = SqlConnection.escapeSql(formatLocalDateYMD(new Date()));

      const [
        stores,
        batchStats,
        criticalBatches,
        recentTransfers,
        transferStats,
        spoilageStats,
        catalogStats
      ] = await Promise.all([
        SqlConnection.queryJson(`
          SELECT id, store_code AS storeCode, store_name AS storeName, ISNULL(status, 'OPEN') AS status
          FROM dbo.store_profile
          ORDER BY id ASC
        `),
        SqlConnection.queryJson(`
          SELECT
            COUNT(*) AS totalBatches,
            ISNULL(SUM(b.current_quantity), 0) AS totalUnits,
            ISNULL(SUM(b.current_quantity * ISNULL(b.import_price, 0)), 0) AS totalInventoryCost,
            ISNULL(SUM(CASE WHEN DATEDIFF(day, ${todaySql}, b.expiry_date) <= 0 THEN b.current_quantity ELSE 0 END), 0) AS expiredUnits,
            ISNULL(SUM(CASE WHEN DATEDIFF(day, ${todaySql}, b.expiry_date) BETWEEN 1 AND 3 THEN b.current_quantity ELSE 0 END), 0) AS criticalRedUnits,
            ISNULL(SUM(CASE WHEN DATEDIFF(day, ${todaySql}, b.expiry_date) BETWEEN 4 AND 7 THEN b.current_quantity ELSE 0 END), 0) AS warningYellowUnits,
            ISNULL(SUM(CASE WHEN DATEDIFF(day, ${todaySql}, b.expiry_date) > 7 THEN b.current_quantity ELSE 0 END), 0) AS safeGreenUnits
          FROM dbo.batches b
          WHERE b.current_quantity > 0 AND b.status <> 'DISPOSED' AND ${storeWhereBatch}
        `),
        SqlConnection.queryJson(`
          SELECT TOP 6
            b.id,
            b.batch_code AS batchCode,
            ISNULL(b.store_id, 1) AS storeId,
            ISNULL(sp.store_name, N'Chi nhánh #1') AS storeName,
            p.name AS productName,
            p.sku,
            b.current_quantity AS currentQuantity,
            b.import_price AS importPrice,
            b.discount_percent AS discountPercent,
            DATEDIFF(day, ${todaySql}, b.expiry_date) AS daysLeft
          FROM dbo.batches b
          INNER JOIN dbo.products p ON b.product_id = p.id
          LEFT JOIN dbo.store_profile sp ON ISNULL(b.store_id, 1) = sp.id
          WHERE b.current_quantity > 0 AND b.status <> 'DISPOSED' AND ${storeWhereBatch}
          ORDER BY b.expiry_date ASC, b.id ASC
        `),
        SqlConnection.queryJson(`
          SELECT TOP 5
            st.transfer_code AS transferCode,
            fs.store_name AS fromStore,
            ts.store_name AS toStore,
            p.name AS productName,
            st.transfer_quantity AS quantity,
            st.shipping_cost AS shippingCost,
            st.status,
            st.ai_recommendation_note AS aiNote
          FROM dbo.stock_transfers st
          INNER JOIN dbo.store_profile fs ON st.from_store_id = fs.id
          INNER JOIN dbo.store_profile ts ON st.to_store_id = ts.id
          INNER JOIN dbo.products p ON st.product_id = p.id
          WHERE ${storeWhereTransfer}
          ORDER BY st.id DESC
        `),
        SqlConnection.queryJson(`
          SELECT
            COUNT(*) AS activeTransfers,
            ISNULL(SUM(st.transfer_quantity * ISNULL(b.import_price, p.selling_price * 0.75)), 0) AS totalSavedValue
          FROM dbo.stock_transfers st
          INNER JOIN dbo.batches b ON st.source_batch_id = b.id
          INNER JOIN dbo.products p ON st.product_id = p.id
          WHERE st.status IN ('APPROVED', 'IN_TRANSIT', 'COMPLETED', 'RECEIVED') AND ${storeWhereTransfer}
        `),
        SqlConnection.queryJson(`
          SELECT
            COUNT(*) AS totalDisposalEvents,
            ISNULL(SUM(sr.cost_loss), 0) AS totalCostLoss,
            ISNULL(SUM(sr.quantity_disposed), 0) AS totalQuantityDisposed
          FROM dbo.spoilage_records sr
          WHERE sr.approved_by IS NOT NULL AND ${storeWhereSpoilage}
        `),
        SqlConnection.queryJson(`
          SELECT COUNT(*) AS totalProducts FROM dbo.products
        `)
      ]);

      const activeStores = (stores || []).filter(s => String(s.status || 'OPEN').toUpperCase() !== 'SUSPENDED');
      const storeCount = activeStores.length || (stores || []).length || 1;
      const isSingleStore = storeCount <= 1;

      const matchedStore = sid ? (stores || []).find(s => Number(s.id) === sid) : null;
      const activeStore = sid
        ? {
            storeId: sid,
            storeCode: matchedStore?.storeCode || `STORE-${sid}`,
            storeName: matchedStore?.storeName || `Chi nhánh #${sid}`
          }
        : {
            storeId: 'ALL',
            storeCode: 'CHAIN-ALL',
            storeName: isSingleStore
              ? (stores[0]?.storeName || 'Cửa hàng chính')
              : `Toàn chuỗi (${storeCount} chi nhánh)`
          };

      return {
        store: activeStore,
        storeCount,
        isSingleStore,
        inventoryStats: batchStats[0] || {},
        criticalBatches: criticalBatches || [],
        recentTransfers: recentTransfers || [],
        transferStats: transferStats[0] || { activeTransfers: 0, totalSavedValue: 0 },
        spoilageStats: spoilageStats[0] || { totalDisposalEvents: 0, totalCostLoss: 0, totalQuantityDisposed: 0 },
        catalogStats: catalogStats[0] || { totalProducts: 0 }
      };
    } catch (err) {
      console.error('[AI ASSISTANT] Lỗi lấy dữ liệu ngữ cảnh:', err.message);
      return {
        store: { storeId: 'ALL', storeName: 'SmartSupply AI' },
        storeCount: 1,
        isSingleStore: false,
        inventoryStats: {},
        criticalBatches: [],
        recentTransfers: [],
        transferStats: { activeTransfers: 0, totalSavedValue: 0 },
        spoilageStats: { totalDisposalEvents: 0, totalCostLoss: 0, totalQuantityDisposed: 0 },
        catalogStats: { totalProducts: 0 },
        error: err.message
      };
    }
  }

  /**
   * Xử lý câu hỏi của người dùng bằng Gemini LLM (nếu có key) hoặc Smart Local Engine
   */
  async ask({ message, apiKey = '', userRole = 'STORE_MANAGER', storeId = 'ALL' }) {
    const rawMsg = String(message || '').trim();
    if (!rawMsg) {
      const err = new Error('Vui lòng nhập câu hỏi cho Trợ lý AI!');
      err.statusCode = 400;
      throw err;
    }

    const context = await this.getLiveSystemContext(storeId);
    const effectiveApiKey = String(apiKey || process.env.GEMINI_API_KEY || '').trim();

    // 1. Gọi Gemini LLM nếu có API key và SDK sẵn sàng
    if (effectiveApiKey) {
      const GoogleGenAIClass = await getGoogleGenAIClass();
      if (GoogleGenAIClass) {
        try {
          const client = new GoogleGenAIClass({ apiKey: effectiveApiKey, apiVersion: 'v1beta' });
          const inv = context.inventoryStats || {};
          const spoilage = context.spoilageStats || {};
          const transferStats = context.transferStats || {};

          const systemInstruction = `
Bạn là SmartSupply AI Assistant (AI 4) — Trợ lý Trí tuệ Nhân tạo hỗ trợ phân tích tồn kho, hạn sử dụng, đặt hàng và điều phối chống lãng phí thực phẩm cho ${context.store?.storeName || 'SmartSupply AI'}.
Vai trò người hỏi: ${userRole}.
Phạm vi dữ liệu đang xem: ${context.store?.storeName} (${context.isSingleStore ? 'Mô hình cửa hàng độc lập' : `Chuỗi ${context.storeCount} chi nhánh`}).

DỮ LIỆU THỰC TẾ TỪ SQL SERVER (KHÔNG BỊA ĐẶT SỐ LIỆU):
- Tổng danh mục SKU: ${context.catalogStats?.totalProducts || 0} sản phẩm.
- Tồn kho khả dụng: ${Number(inv.totalUnits || 0).toLocaleString('vi-VN')} đơn vị (${inv.totalBatches || 0} lô, vốn tồn ${Number(inv.totalInventoryCost || 0).toLocaleString('vi-VN')} đ).
- Phân bố hạn sử dụng: Vùng Đỏ (1–3 ngày): ${inv.criticalRedUnits || 0} ĐV; Vùng Vàng (4–7 ngày): ${inv.warningYellowUnits || 0} ĐV; Vùng Xanh (>7 ngày): ${inv.safeGreenUnits || 0} ĐV; Đã hết hạn (<=0 ngày): ${inv.expiredUnits || 0} ĐV.
- Các lô rủi ro cao nhất: ${JSON.stringify((context.criticalBatches || []).map(b => `${b.productName} (Lô ${b.batchCode}, ${b.storeName}, SL: ${b.currentQuantity}, còn ${b.daysLeft} ngày, giảm ${b.discountPercent || 0}%)`))}.
- Thiệt hại tiêu hủy đã duyệt: ${Number(spoilage.totalCostLoss || 0).toLocaleString('vi-VN')} đ (${spoilage.totalQuantityDisposed || 0} ĐV qua ${spoilage.totalDisposalEvents || 0} phiếu).
${context.isSingleStore
  ? '- Mô hình đơn lẻ 1 cửa hàng: Không áp dụng điều chuyển liên chi nhánh.'
  : `- Điều phối liên chi nhánh: ${transferStats.activeTransfers || 0} phiếu đã duyệt/đang chuyển/hoàn tất, giá trị hàng hóa được cứu ~${Number(transferStats.totalSavedValue || 0).toLocaleString('vi-VN')} đ. Phiếu gần nhất: ${JSON.stringify((context.recentTransfers || []).map(t => `${t.transferCode}: ${t.fromStore} -> ${t.toStore}, SP: ${t.productName}, SL: ${t.quantity}, Trạng thái: ${t.status}`))}.`}

NGUYÊN TẮC TRẢ LỜI:
1. Trả lời bằng tiếng Việt ngắn gọn, rành mạch, dùng Markdown rõ ràng, chỉ căn cứ số liệu thực tế trên.
2. Nếu được hỏi về lý do giảm/nhập ít hàng, giải thích dựa trên nguyên lý DOS > DUE (tồn kho vượt khả năng bán trước hạn), hàng cận date cần xả bằng Quick Markdown/FEFO và thời tiết/lịch lễ.
`.trim();

          const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: rawMsg,
            config: { systemInstruction }
          });

          const replyText = response?.text || response?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText) {
            return {
              success: true,
              reply: replyText.trim(),
              mode: 'GEMINI_LLM',
              model: 'gemini-2.5-flash',
              scopeStoreName: context.store?.storeName,
              timestamp: new Date().toISOString(),
              suggestedQuestions: this.getSuggestedQuestions(rawMsg, context.isSingleStore)
            };
          }
        } catch (geminiErr) {
          console.warn('[AI ASSISTANT] Lỗi gọi Gemini API (chuyển sang Smart Local Engine):', geminiErr.message);
        }
      }
    }

    // 2. Fallback: Smart Local Supply Chain Intelligence Engine (dữ liệu SQL thật 100%)
    const localReply = this.generateLocalInsight(rawMsg, context);
    return {
      success: true,
      reply: localReply,
      mode: 'LOCAL_INTELLIGENCE_ENGINE',
      model: 'SmartSupply-Rule-Engine-v4 (SQL Live)',
      scopeStoreName: context.store?.storeName,
      timestamp: new Date().toISOString(),
      suggestedQuestions: this.getSuggestedQuestions(rawMsg, context.isSingleStore)
    };
  }

  /**
   * Động cơ suy luận quy tắc nội bộ dựa hoàn toàn trên dữ liệu thật từ SQL Server
   */
  generateLocalInsight(query, ctx) {
    const q = query.toLowerCase();
    const inv = ctx.inventoryStats || {};
    const criticals = ctx.criticalBatches || [];
    const transfers = ctx.recentTransfers || [];
    const transferStats = ctx.transferStats || {};
    const spoilage = ctx.spoilageStats || {};
    const scopeLabel = ctx.store?.storeName || 'Toàn chuỗi';

    // 1. Lý giải đề xuất giảm nhập / tồn dư DOS > DUE
    if (q.includes('nhập ít') || q.includes('giảm nhập') || q.includes('tại sao') || q.includes('cơm hộp') || q.includes('sandwich') || q.includes('đề xuất nhập')) {
      const matched = criticals.find(b =>
        String(b.productName || '').toLowerCase().includes('sandwich') ||
        String(b.productName || '').toLowerCase().includes('cơm')
      ) || criticals[0];

      if (!matched) {
        return `### 💡 Phân Tích Đề Xuất Nhập Hàng (${scopeLabel}):

Hiện chưa ghi nhận lô hàng cận date hoặc quá hạn nào trong phạm vi **${scopeLabel}** (tổng tồn: **${Number(inv.totalUnits || 0).toLocaleString('vi-VN')} ĐV**).

Hệ thống tính toán khuyến nghị đặt hàng dựa trên công thức **ROP + Dự báo 7 ngày**:
- \`ROP = (Sức bán điều chỉnh thời tiết/lễ × LeadTime) + SafetyStock\`.
- Tự động trừ lượng hàng tồn khả dụng và hàng đang trên đường giao (PO \`APPROVED\`/\`IN_TRANSIT\`), đồng thời cảnh báo **DOS > DUE** nếu lượng tồn vượt quá hạn sử dụng còn lại.`;
      }

      const prodName = matched.productName;
      const daysLeft = Number(matched.daysLeft ?? 0);
      const stockQty = Number(matched.currentQuantity ?? 0);

      return `### 💡 Giải Thích Đề Xuất Hạn Chế Nhập Hàng (${scopeLabel}):

Với mặt hàng ưu tiên theo dõi như **${prodName}** (Lô \`${matched.batchCode}\` tại *${matched.storeName}*):

1. **Rủi ro ứ đọng vượt hạn (DOS > DUE - Rule 8):**
   - Lô hiện còn **${stockQty.toLocaleString('vi-VN')} đơn vị**, thời hạn sử dụng chỉ còn **${daysLeft} ngày**${matched.discountPercent > 0 ? ` (đang giảm giá ${matched.discountPercent}%)` : ''}.
   - Nếu tiếp tục nhập thêm lô mới từ DC trong khi tồn cũ chưa tiêu thụ hết, số ngày cần để bán hết (DOS) sẽ vượt quá hạn dùng còn lại (DUE) và phát sinh hàng hủy.
2. **Ưu tiên giải phóng tồn cũ trước khi đặt thêm:**
   - Kích hoạt **Quick Markdown** (15%–50%) và **đảo kệ mặt tiền FEFO** để ưu tiên xuất bán lô \`${matched.batchCode}\` trước.${!ctx.isSingleStore ? '\n   - Kiểm tra tab **06. Stock Transfer** nếu chi nhánh khác đang thiếu hàng và chi phí vận chuyển thấp hơn giá trị cứu hàng.' : ''}`;
    }

    // 2. Cảnh báo nguy cơ hủy / hết hạn
    if (q.includes('nguy cơ') || q.includes('hết hạn') || q.includes('hủy') || q.includes('quá hạn') || q.includes('3 ngày') || q.includes('đỏ') || q.includes('vàng')) {
      const redCount = Number(inv.criticalRedUnits || 0);
      const yellowCount = Number(inv.warningYellowUnits || 0);
      const expiredCount = Number(inv.expiredUnits || 0);

      const batchListStr = criticals.length > 0
        ? criticals.slice(0, 4).map(b =>
            `- **${b.productName}** (Lô \`${b.batchCode}\` • *${b.storeName}*): còn **${Number(b.currentQuantity || 0).toLocaleString('vi-VN')} ĐV**, hạn dùng còn **${b.daysLeft} ngày** (Giá vốn: ${Number(b.importPrice || 0).toLocaleString('vi-VN')} đ)`
          ).join('\n')
        : '- Không có lô hàng nào đang ở trạng thái cận date hoặc hết hạn trong phạm vi đang xem.';

      return `### ⚠️ Đánh Giá Nguy Cơ Lãng Phí (${scopeLabel}):

Thống kê thực tế theo 3 ngưỡng cảnh báo hạn dùng (Rule 4 & Rule 5):

- 🔴 **Vùng Đỏ nguy kịch (1–3 ngày):** **${redCount.toLocaleString('vi-VN')} đơn vị** cần xả hàng khẩn trong ngày.
- 🟡 **Vùng Vàng cảnh báo (4–7 ngày):** **${yellowCount.toLocaleString('vi-VN')} đơn vị** cần đưa vào danh sách đảo kệ mặt tiền.
- ⛔ **Đã hết hạn (≤ 0 ngày):** **${expiredCount.toLocaleString('vi-VN')} đơn vị** (bị khóa cứng tại POS, cần lập biên bản tiêu hủy 2 pha).

**Top lô hàng ưu tiên xử lý ngay:**
${batchListStr}

**Hành động đề xuất:**
1. Dán tem **Quick Markdown** (Vùng Vàng 15%–30%, Vùng Đỏ 40%–50%) tại trang **07. Spoilage Alerts**.
2. Thực hiện SOP **đảo kệ mặt tiền 5 bước** để đưa lô HSD gần nhất ra ngoài.
3. Đối với lô đã quá hạn (≤ 0 ngày), lập phiếu tiêu hủy chờ Quản lý/Chủ chuỗi duyệt ghi nhận Sổ hao hụt.`;
    }

    // 3. Điều phối liên chi nhánh
    if (q.includes('điều phối') || q.includes('chuyển hàng') || q.includes('or-tools') || q.includes('chi nhánh') || q.includes('store')) {
      if (ctx.isSingleStore) {
        return `### 🏪 Trạng Thái Mô Hình Cửa Hàng Độc Lập (${scopeLabel}):

Hệ thống đang vận hành ở chế độ **1 cửa hàng duy nhất**, vì vậy phân hệ điều chuyển liên chi nhánh (**06. Stock Transfer**) được tự động ẩn theo đúng thiết kế MVP.

Để tối ưu tồn kho và giảm lãng phí, hệ thống tập trung vào:
- Đề xuất đặt hàng từ DC/NCC tại **05. Smart Ordering**.
- Giải phóng hàng cận date bằng **Quick Markdown** và **SOP đảo kệ FEFO** tại **07. Spoilage Alerts**.`;
      }

      const activeCount = Number(transferStats.activeTransfers || 0);
      const savedVal = Number(transferStats.totalSavedValue || 0);
      const transferListStr = transfers.length > 0
        ? transfers.map(t =>
            `- **${t.transferCode}**: Chuyển **${Number(t.quantity || 0).toLocaleString('vi-VN')} ĐV ${t.productName}** (*${t.fromStore}* ➔ *${t.toStore}* • Phí: ${Number(t.shippingCost || 0).toLocaleString('vi-VN')} đ • Trạng thái: \`${t.status}\`)`
          ).join('\n')
        : '- Chưa có phiếu điều chuyển nào được tạo trong phạm vi đang chọn.';

      return `### 🔄 Tối Ưu Điều Phối Liên Chi Nhánh (${scopeLabel}):

- **Số phiếu đã duyệt / đang chuyển / hoàn tất:** **${activeCount} phiếu**.
- **Tổng giá trị hàng hóa được cứu qua điều chuyển:** **${savedVal.toLocaleString('vi-VN')} đ** (chỉ đề xuất khi lợi ích ròng \`Giá trị cứu - Phí vận chuyển > 0\` và lô còn đủ HSD).

**Các phiếu điều chuyển gần nhất:**
${transferListStr}

**Vòng đời phê duyệt trên hệ thống:**
\`PROPOSED\` / \`PENDING\` ➔ \`APPROVED\` (giữ tồn lô nguồn) ➔ \`IN_TRANSIT\` ➔ \`COMPLETED\` (cộng lô mới tại chi nhánh nhận) hoặc \`CANCELLED\` (hoàn tồn nếu hủy).`;
    }

    // 4. Báo cáo tổng quan / KPI / Hao hụt
    if (q.includes('báo cáo') || q.includes('kpi') || q.includes('hôm nay') || q.includes('hiệu quả') || q.includes('tổng quan') || q.includes('hao hụt')) {
      const totalUnits = Number(inv.totalUnits || 0);
      const totalCost = Number(inv.totalInventoryCost || 0);
      const totalLoss = Number(spoilage.totalCostLoss || 0);
      const totalDisposed = Number(spoilage.totalQuantityDisposed || 0);
      const totalProducts = Number(ctx.catalogStats?.totalProducts || 0);
      const savedVal = Number(transferStats.totalSavedValue || 0);

      return `### 📊 Báo Cáo Tổng Hợp Vận Hành (${scopeLabel}):

- **Tồn kho khả dụng:** **${totalUnits.toLocaleString('vi-VN')} đơn vị** (${inv.totalBatches || 0} lô • tổng danh mục ${totalProducts} SKU • vốn tồn **${totalCost.toLocaleString('vi-VN')} đ**).
- **Rủi ro hạn dùng hiện tại:** **${Number(inv.criticalRedUnits || 0).toLocaleString('vi-VN')} ĐV** Vùng Đỏ • **${Number(inv.warningYellowUnits || 0).toLocaleString('vi-VN')} ĐV** Vùng Vàng • **${Number(inv.expiredUnits || 0).toLocaleString('vi-VN')} ĐV** hết hạn.
- **Thiệt hại hao hụt đã duyệt (Sổ Spoilage):** **${totalLoss.toLocaleString('vi-VN')} đ** (${totalDisposed.toLocaleString('vi-VN')} ĐV qua ${spoilage.totalDisposalEvents || 0} phiếu).${!ctx.isSingleStore ? `\n- **Giá trị hàng cứu qua điều phối chi nhánh:** **${savedVal.toLocaleString('vi-VN')} đ** (${transferStats.activeTransfers || 0} phiếu đã duyệt/hoàn tất).` : ''}`;
    }

    // 5. Mặc định
    const defaultTransferHint = ctx.isSingleStore
      ? ''
      : `\n- 🔄 **Điều phối chi nhánh:** *"Tình hình điều phối hàng giữa các chi nhánh hiện tại thế nào?"*`;

    return `### 👋 Xin chào, tôi là SmartSupply AI Assistant (${scopeLabel})

Tôi đang kết nối trực tiếp với dữ liệu SQL Server của **${scopeLabel}** (${Number(inv.totalUnits || 0).toLocaleString('vi-VN')} đơn vị tồn kho). Bạn có thể hỏi:

- 💡 **Giải thích nhập hàng:** *"Tại sao hệ thống khuyến nghị giảm nhập mặt hàng cận date?"*
- ⚠️ **Kiểm soát hạn dùng:** *"Những mặt hàng nào có nguy cơ hủy cao nhất trong 3 ngày tới?"*${defaultTransferHint}
- 📊 **Tổng hợp KPI:** *"Báo cáo tổng kết tồn kho và hao hụt hôm nay"*`;
  }

  getSuggestedQuestions(prevQuery = '', isSingleStore = false) {
    const questions = [
      'Tại sao hệ thống khuyến nghị giảm nhập mặt hàng cận date?',
      'Những mặt hàng nào có nguy cơ hủy cao nhất trong 3 ngày tới?',
      ...(isSingleStore
        ? []
        : ['Tình hình điều phối hàng giữa các chi nhánh hiện tại thế nào?']),
      'Báo cáo tổng kết tồn kho và hao hụt hôm nay'
    ];
    return questions
      .filter(q => q.toLowerCase() !== String(prevQuery || '').toLowerCase())
      .slice(0, 3);
  }
}

module.exports = new AiAssistantService();
