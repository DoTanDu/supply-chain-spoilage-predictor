// src/application/use-cases/sales/ValidateAndImportPosCsvUseCase.js
const SqlConnection = require('../../../infrastructure/database/sqlConnection');

class ValidateAndImportPosCsvUseCase {
  constructor({ productRepository, saleRepository }) {
    this.productRepository = productRepository;
    this.saleRepository = saleRepository;
  }

  /**
   * Phân tích và chuẩn hóa nội dung CSV (hỗ trợ cả dấu phẩy ',' và chấm phẩy ';')
   */
  parseCsvRows(csvContent) {
    if (!csvContent || typeof csvContent !== 'string') return [];
    
    // Loại bỏ UTF-8 BOM nếu có
    const cleanText = csvContent.replace(/^\uFEFF/, '').trim();
    const lines = cleanText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];

    const delimiter = lines[0].includes(';') ? ';' : ',';
    
    // Đọc header và chuẩn hóa tên cột
    const rawHeaders = lines[0].split(delimiter).map(h => 
      h.trim().replace(/^["']|["']$/g, '').toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
    );

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Xử lý split có tính đến ngoặc kép
      const values = [];
      let inQuotes = false;
      let currentVal = '';
      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          values.push(currentVal.trim().replace(/^["']|["']$/g, ''));
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      values.push(currentVal.trim().replace(/^["']|["']$/g, ''));

      const rowObj = {};
      rawHeaders.forEach((h, idx) => {
        rowObj[h] = values[idx] || '';
      });
      rowObj._rawLineIndex = i + 1;
      rows.push(rowObj);
    }

    return rows;
  }

  /**
   * Bước 1: Kiểm tra tính hợp lệ và toàn vẹn của dữ liệu POS (Validation)
   */
  async validate(csvContent) {
    const rawRows = this.parseCsvRows(csvContent);
    if (rawRows.length === 0) {
      return {
        success: false,
        message: 'File CSV không có dữ liệu hoặc định dạng không hợp lệ!',
        summary: { total: 0, valid: 0, invalid: 0, totalAmount: 0 },
        validatedRows: []
      };
    }

    // Lấy toàn bộ danh mục sản phẩm từ CSDL để đối soát SKU
    const allProducts = await SqlConnection.queryJson(`
      SELECT id, sku, name, selling_price AS price, min_stock_level AS minStock
      FROM dbo.products
    `);

    const productBySku = new Map();
    for (const p of allProducts) {
      productBySku.set(String(p.sku).trim(), p);
    }

    const validatedRows = [];
    let validCount = 0;
    let invalidCount = 0;
    let totalEstimatedAmount = 0;

    for (const r of rawRows) {
      const errors = [];
      const warnings = [];

      // 1. Nhận diện các cột linh hoạt
      const txnCode = r['ma_giao_dich'] || r['magiaodich'] || r['ma_hd'] || r['transaction_code'] || `POS-CSV-${Date.now().toString().slice(-6)}`;
      const rawSku = String(r['ma_sku'] || r['masku'] || r['sku'] || '').trim();
      const rawDate = r['ngay_ban'] || r['ngayban'] || r['sale_date'] || r['date'] || new Date().toISOString().slice(0, 10);
      const rawQty = r['so_luong'] || r['soluong'] || r['quantity'] || r['qty'] || 0;
      const rawPrice = r['don_gia'] || r['dongia'] || r['price'] || 0;
      const rawWeather = String(r['thoi_tiet'] || r['thoitiet'] || r['weather'] || 'NORMAL').trim().toUpperCase();
      const rawHoliday = r['ngay_le'] || r['ngayle'] || r['is_holiday'] || 0;
      const storeCode = r['chi_nhanh'] || r['chinhanh'] || r['store_code'] || 'RETAIL-STORE-01';

      // 2. Validate SKU
      let matchedProduct = null;
      if (!rawSku) {
        errors.push('Thiếu mã SKU sản phẩm');
      } else {
        matchedProduct = productBySku.get(rawSku);
        if (!matchedProduct) {
          // Thử tìm theo mã không dấu hoặc đuôi SKU
          for (const [skuKey, p] of productBySku.entries()) {
            if (skuKey.endsWith(rawSku) || rawSku.endsWith(skuKey)) {
              matchedProduct = p;
              break;
            }
          }
        }
        if (!matchedProduct) {
          errors.push(`Mã SKU '${rawSku}' không tồn tại trong CSDL 80 sản phẩm`);
        }
      }

      // 3. Validate Số lượng bán
      const qty = Number(rawQty);
      if (isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
        errors.push(`Số lượng bán '${rawQty}' không hợp lệ (phải là số nguyên > 0)`);
      }

      // 4. Validate Đơn giá
      let price = Number(rawPrice);
      if (isNaN(price) || price <= 0) {
        if (matchedProduct) {
          price = Number(matchedProduct.price);
          warnings.push(`Sử dụng giá niêm yết hệ thống: ${price.toLocaleString('vi-VN')}đ`);
        } else {
          errors.push(`Đơn giá '${rawPrice}' không hợp lệ`);
        }
      } else if (matchedProduct && Math.abs(price - matchedProduct.price) / matchedProduct.price > 0.4) {
        warnings.push(`Đơn giá (${price.toLocaleString('vi-VN')}đ) lệch >40% so với giá niêm yết (${matchedProduct.price.toLocaleString('vi-VN')}đ)`);
      }

      // 5. Validate Ngày bán
      let validSaleDate = rawDate;
      const parsedDate = new Date(rawDate);
      if (isNaN(parsedDate.getTime())) {
        errors.push(`Ngày bán '${rawDate}' sai định dạng (chuẩn: YYYY-MM-DD)`);
      } else {
        validSaleDate = parsedDate.toISOString().slice(0, 10);
      }

      // 6. Validate Thời tiết & Ngày lễ
      const safeWeather = ['SUNNY', 'RAINY'].includes(rawWeather) ? rawWeather : 'NORMAL';
      const isHoliday = (rawHoliday === '1' || rawHoliday === 1 || String(rawHoliday).toLowerCase() === 'true') ? 1 : 0;

      const isValid = errors.length === 0;
      const lineTotal = isValid ? qty * price : 0;

      if (isValid) {
        validCount++;
        totalEstimatedAmount += lineTotal;
      } else {
        invalidCount++;
      }

      validatedRows.push({
        lineIndex: r._rawLineIndex,
        transactionCode: txnCode,
        sku: rawSku,
        productId: matchedProduct?.id || null,
        productName: matchedProduct?.name || r['ten_san_pham'] || r['tensanpham'] || 'Chưa xác định',
        quantitySold: isValid ? qty : 0,
        rawQuantity: rawQty,
        salePrice: isValid ? price : 0,
        rawPrice,
        lineTotal,
        saleDate: validSaleDate,
        weather: safeWeather,
        isHoliday,
        storeCode,
        isValid,
        errors,
        warnings
      });
    }

    const dataQualityScore = rawRows.length > 0 ? Math.round((validCount / rawRows.length) * 100) : 0;

    return {
      success: true,
      dataQualityScore, // 0 - 100%
      summary: {
        totalRows: rawRows.length,
        validRows: validCount,
        invalidRows: invalidCount,
        totalEstimatedAmount,
        canImport: validCount > 0
      },
      validatedRows
    };
  }

  /**
   * Bước 2: Nhập các bản ghi hợp lệ vào bảng dbo.sales_history bằng Transaction SQL Server (Rule 11)
   */
  async commitImport({ csvContent, validatedData, cashierId = 3, storeId = 1 }) {
    let rowsToImport = [];

    if (validatedData && Array.isArray(validatedData.validatedRows)) {
      rowsToImport = validatedData.validatedRows.filter(r => r.isValid && r.productId);
    } else {
      const valRes = await this.validate(csvContent);
      if (!valRes.success || valRes.summary.validRows === 0) {
        throw new Error('Dữ liệu không có dòng nào hợp lệ để nhập kho!');
      }
      rowsToImport = valRes.validatedRows.filter(r => r.isValid && r.productId);
    }

    if (rowsToImport.length === 0) {
      throw new Error('Không có bản ghi hợp lệ nào để nạp vào CSDL!');
    }

    // Lấy map lô hàng khả dụng gần nhất (FEFO) để liên kết batch_id
    const activeBatches = await SqlConnection.queryJson(`
      SELECT id, product_id AS productId, current_quantity AS qty, expiry_date AS expiryDate
      FROM dbo.batches
      WHERE current_quantity > 0 AND status IN ('ACTIVE', 'WARNING')
      ORDER BY expiry_date ASC, id ASC
    `);

    const batchByProduct = new Map();
    for (const b of activeBatches) {
      if (!batchByProduct.has(b.productId)) {
        batchByProduct.set(b.productId, b.id);
      }
    }

    const fallbackBatchRow = await SqlConnection.queryJson(`SELECT TOP 1 id FROM dbo.batches ORDER BY id ASC`);
    const fallbackBatchId = fallbackBatchRow[0]?.id || 1;

    // Chuẩn bị câu lệnh chèn hàng loạt vào dbo.sales_history
    const insertStatements = [];
    const safeCashierId = Number(cashierId || 3);
    const safeStoreId = Number(storeId || 1);

    for (const r of rowsToImport) {
      const bId = batchByProduct.get(r.productId) || fallbackBatchId;
      const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const dow = dayNames[new Date(r.saleDate).getDay()];

      insertStatements.push(`
        INSERT INTO dbo.sales_history (
          transaction_code, product_id, batch_id, quantity_sold, sale_price,
          total_amount, sale_date, day_of_week, weather, is_holiday,
          cashier_id, store_id, created_at
        )
        VALUES (
          ${SqlConnection.escapeSql(r.transactionCode)},
          ${Number(r.productId)},
          ${bId},
          ${Number(r.quantitySold)},
          ${Number(r.salePrice)},
          ${Number(r.lineTotal)},
          ${SqlConnection.escapeSql(r.saleDate)},
          ${SqlConnection.escapeSql(dow)},
          ${SqlConnection.escapeSql(r.weather)},
          ${r.isHoliday ? 1 : 0},
          ${safeCashierId},
          ${safeStoreId},
          GETDATE()
        );
      `);
    }

    const totalImportedAmount = rowsToImport.reduce((sum, r) => sum + r.lineTotal, 0);

    const transactionSql = `
      BEGIN TRANSACTION;
      BEGIN TRY
        ${insertStatements.join('\n')}

        INSERT INTO dbo.system_audit_logs (user_id, action_type, entity_name, entity_id, description, ip_address, created_at)
        VALUES (
          ${safeCashierId},
          N'IMPORT_POS_CSV',
          N'SalesHistory',
          CAST(SCOPE_IDENTITY() AS NVARCHAR(50)),
          N'Nhập thành công ${rowsToImport.length} giao dịch POS từ file Excel/CSV. Tổng doanh số: ${totalImportedAmount.toLocaleString('vi-VN')} VNĐ',
          N'127.0.0.1',
          GETDATE()
        );

        COMMIT TRANSACTION;
        SELECT 'SUCCESS' AS resultStatus, ${rowsToImport.length} AS importedCount, ${totalImportedAmount} AS totalAmount;
      END TRY
      BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
      END CATCH;
    `;

    const result = await SqlConnection.executeSql(transactionSql);

    return {
      success: true,
      message: `Đã nạp thành công ${rowsToImport.length} giao dịch POS vào CSDL Sales History!`,
      importedCount: rowsToImport.length,
      totalAmount: totalImportedAmount,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Tạo nội dung file CSV mẫu chuẩn hóa
   */
  getStandardTemplateCsv() {
    return [
      'Ma_Giao_Dich,Ngay_Ban,Ma_SKU,Ten_San_Pham,So_Luong,Don_Gia,Thoi_Tiet,Ngay_Le,Chi_Nhanh',
      'HD-20261118-001,2026-11-18,8934567890101,Sữa tươi tiệt trùng Vinamilk 100% Không đường 1L,12,36000,NORMAL,0,RETAIL-STORE-01',
      'HD-20261118-002,2026-11-18,8934567890102,Sữa tươi tiệt trùng Vinamilk 100% Có đường 1L,15,36000,SUNNY,0,RETAIL-STORE-01',
      'HD-20261118-003,2026-11-18,8934567890103,Sữa chua ăn Vinamilk Nha Đam 100g,20,8500,SUNNY,0,RETAIL-STORE-01',
      'HD-20261118-004,2026-11-18,8934567890201,Bánh mì Sandwich tươi Kinh Đô 250g,10,22000,NORMAL,0,RETAIL-STORE-01',
      'HD-20261118-005,2026-11-18,8934567890202,Bánh bao nhân thịt trứng cút Thọ Phát 120g,14,16000,RAINY,0,RETAIL-STORE-01',
      'HD-20261118-006,2026-11-18,8934567890204,Cơm nắm Onigiri cá hồi sốt Mayo 110g,8,18000,NORMAL,0,RETAIL-STORE-01',
      'HD-20261118-007,2026-11-17,8934567890105,Sữa tươi tiệt trùng TH True MILK Nguyên chất 1L,11,37500,NORMAL,0,RETAIL-STORE-01',
      'HD-20261118-008,2026-11-17,8934567890104,Sữa chua uống men sống Probi 130ml,18,10000,SUNNY,1,RETAIL-STORE-01'
    ].join('\r\n');
  }
}

module.exports = ValidateAndImportPosCsvUseCase;
