// src/infrastructure/database/repositories/SqlSpoilageRepository.js
const SqlConnection = require('../sqlConnection');
const ISpoilageRepository = require('../../../domain/interfaces/ISpoilageRepository');

class SqlSpoilageRepository extends ISpoilageRepository {
  /**
   * Tạo biên bản tiêu hủy và hạch toán Sổ hao hụt tài chính bất biến (Rule 6)
   * Tuân thủ quy trình 2 pha (Mục 14.3 SSOT):
   * - Nếu có approvedBy (Quản lý tự lập): Khấu trừ kho ngay lập tức.
   * - Nếu approvedBy là NULL (Nhân viên lập đề xuất PENDING): KHÔNG trừ kho, bảo vệ tài sản chờ kiểm tra thực tế.
   */
  async createSpoilageRecordTransaction(params = {}) {
    const sr = params.spoilageRecord || params;
    const code = SqlConnection.escapeSql(sr.recordCode);
    const bId = Number(params.batchId || sr.batchId);
    const safeDate = SqlConnection.escapeSql(new Date(sr.disposedDate || new Date()).toISOString().slice(0, 10));
    const qty = Number(params.quantityDisposed || sr.quantityDisposed);
    const cost = Number(sr.costLoss);
    const reason = SqlConnection.escapeSql(sr.reason || 'EXPIRED');
    const notes = SqlConnection.escapeSql(sr.notes || '');
    const performedBy = Number(sr.performedBy);
    const isAutoApproved = sr.approvedBy !== null && sr.approvedBy !== undefined;
    const approvedBy = isAutoApproved ? Number(sr.approvedBy) : 'NULL';

    const updateBatchSql = isAutoApproved ? `
        -- Pha Quản lý lập trực tiếp: Khấu trừ tồn kho của lô hàng và cập nhật DISPOSED nếu hết sạch (Rule 3 & Rule 6)
        UPDATE batches WITH (UPDLOCK, ROWLOCK)
        SET current_quantity = current_quantity - ${qty},
            status = CASE WHEN (current_quantity - ${qty}) = 0 THEN 'DISPOSED' ELSE status END
        WHERE id = ${bId} AND current_quantity >= ${qty};

        IF @@ROWCOUNT = 0
        BEGIN
          THROW 50002, N'Số lượng tiêu hủy vượt quá số lượng tồn hiện tại của lô hàng!', 1;
        END
    ` : `
        -- Pha 1: Nhân viên lập đề xuất PENDING - Xác nhận lượng tồn khả dụng nhưng CHƯA trừ kho (Mục 14.3 SSOT)
        IF NOT EXISTS (SELECT 1 FROM batches WITH (HOLDLOCK) WHERE id = ${bId} AND current_quantity >= ${qty})
        BEGIN
          THROW 50002, N'Số lượng đề xuất hủy vượt quá số lượng tồn hiện tại của lô hàng!', 1;
        END
    `;

    const transactionSql = `
      BEGIN TRANSACTION;
      BEGIN TRY
        ${updateBatchSql}

        DECLARE @newSpoilId INT;

        -- Chèn vào Sổ hao hụt tài chính bất biến SpoilageRecords
        INSERT INTO spoilage_records (
          record_code, batch_id, disposed_date, quantity_disposed, cost_loss,
          reason, notes, performed_by, approved_by, created_at
        ) VALUES (
          ${code}, ${bId}, ${safeDate}, ${qty}, ${cost},
          ${reason}, ${notes}, ${performedBy}, ${approvedBy}, GETDATE()
        );

        SET @newSpoilId = SCOPE_IDENTITY();
        COMMIT TRANSACTION;
        SELECT @newSpoilId AS id, ${code} AS recordCode FOR JSON PATH;
      END TRY
      BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
      END CATCH;
    `;

    const rows = await SqlConnection.queryJson(transactionSql);
    return rows.length > 0 ? rows[0] : { recordCode: sr.recordCode };
  }

  /**
   * Lấy danh sách các biên bản tiêu hủy gần nhất (hỗ trợ lọc theo storeId)
   */
  async findRecentRecords(limit = 50, storeId = null) {
    let storeWhere = '1=1';
    if (storeId && String(storeId).toUpperCase() !== 'ALL' && !isNaN(Number(storeId))) {
      storeWhere = `b.store_id = ${Number(storeId)}`;
    }
    const sql = `
      SELECT TOP (${Number(limit)})
        sr.id AS dbId,
        sr.record_code AS id,
        sr.record_code AS recordCode,
        sr.batch_id AS batchId,
        b.store_id AS storeId,
        sp.store_code AS storeCode,
        sp.store_name AS storeName,
        b.batch_code AS batchCode,
        p.name AS productName,
        p.sku AS productSku,
        p.unit AS unit,
        CONVERT(VARCHAR(10), sr.disposed_date, 23) AS date,
        CONVERT(VARCHAR(10), sr.disposed_date, 23) AS disposedDate,
        sr.quantity_disposed AS quantity,
        sr.quantity_disposed AS quantityDisposed,
        b.import_price AS costPrice,
        b.import_price AS importPrice,
        sr.cost_loss AS totalLoss,
        sr.cost_loss AS costLoss,
        sr.reason,
        sr.notes,
        u1.full_name AS performedByName,
        u2.full_name AS approvedBy,
        u2.full_name AS approvedByName,
        CASE WHEN sr.approved_by IS NOT NULL THEN 'APPROVED' ELSE 'PENDING' END AS status,
        sr.created_at AS createdAt
      FROM spoilage_records sr
      INNER JOIN batches b ON sr.batch_id = b.id
      LEFT JOIN store_profile sp ON b.store_id = sp.id
      INNER JOIN products p ON b.product_id = p.id
      INNER JOIN users u1 ON sr.performed_by = u1.id
      LEFT JOIN users u2 ON sr.approved_by = u2.id
      WHERE ${storeWhere}
      ORDER BY sr.id DESC;
    `;
    return await SqlConnection.queryJson(sql);
  }

  /**
   * Phê duyệt biên bản tiêu hủy đang chờ duyệt & Chốt sổ hao hụt tài chính (Pha 2 - Rule 6 & SoD Mục 14.3 SSOT)
   * Thực thi Transaction nguyên tử có khóa UPDLOCK, ROWLOCK:
   * - Khấu trừ tồn kho batches
   * - Chuyển trạng thái DISPOSED nếu tồn kho chạm 0
   * - Gán mã Cửa hàng trưởng approved_by
   */
  async approveRecord(idOrCode, approvedByUserId) {
    const isNumeric = !isNaN(Number(idOrCode)) && !String(idOrCode).toUpperCase().startsWith('SPOIL');
    const whereClause = isNumeric
      ? `id = ${Number(idOrCode)}`
      : `record_code = ${SqlConnection.escapeSql(String(idOrCode))}`;

    const approverId = Number(approvedByUserId);

    const approveTransactionSql = `
      BEGIN TRANSACTION;
      BEGIN TRY
        DECLARE @spoilId INT, @recCode NVARCHAR(50), @bId INT, @qty INT, @alreadyApproved INT;

        SELECT 
          @spoilId = id,
          @recCode = record_code,
          @bId = batch_id,
          @qty = quantity_disposed,
          @alreadyApproved = CASE WHEN approved_by IS NOT NULL THEN 1 ELSE 0 END
        FROM spoilage_records WITH (UPDLOCK, ROWLOCK)
        WHERE ${whereClause};

        IF @spoilId IS NULL
        BEGIN
          THROW 50003, N'Không tìm thấy biên bản tiêu hủy để phê duyệt!', 1;
        END

        -- Nếu biên bản đang ở trạng thái PENDING, tiến hành khấu trừ kho batches (Pha 2: Approval Phase)
        IF @alreadyApproved = 0
        BEGIN
          UPDATE batches WITH (UPDLOCK, ROWLOCK)
          SET current_quantity = current_quantity - @qty,
              status = CASE WHEN (current_quantity - @qty) = 0 THEN 'DISPOSED' ELSE status END
          WHERE id = @bId AND current_quantity >= @qty;

          IF @@ROWCOUNT = 0
          BEGIN
            THROW 50002, N'Số lượng đề xuất hủy vượt quá số lượng tồn hiện tại của lô hàng khi duyệt!', 1;
          END

          UPDATE spoilage_records
          SET approved_by = ${approverId}
          WHERE id = @spoilId;
        END

        COMMIT TRANSACTION;

        SELECT TOP 1
          sr.id AS dbId,
          sr.record_code AS id,
          sr.record_code AS recordCode,
          sr.batch_id AS batchId,
          b.batch_code AS batchCode,
          sr.quantity_disposed AS quantityDisposed,
          sr.cost_loss AS costLoss,
          u2.full_name AS approvedByName,
          'APPROVED' AS status
        FROM spoilage_records sr
        INNER JOIN batches b ON sr.batch_id = b.id
        LEFT JOIN users u2 ON sr.approved_by = u2.id
        WHERE sr.id = @spoilId
        FOR JSON PATH;
      END TRY
      BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
      END CATCH;
    `;

    const rows = await SqlConnection.queryJson(approveTransactionSql);
    return rows && rows.length > 0 ? rows[0] : null;
  }

  /**
   * Tính tổng thiệt hại tài chính theo khoảng thời gian và phân rã 5 nhóm nguyên nhân chuẩn ReFED/GS1
   */
  async getLossSummary(startDate = null, endDate = null, storeId = null) {
    let whereClause = '1=1';
    if (startDate) {
      whereClause += ` AND sr.disposed_date >= ${SqlConnection.escapeSql(startDate)}`;
    }
    if (endDate) {
      whereClause += ` AND sr.disposed_date <= ${SqlConnection.escapeSql(endDate)}`;
    }
    if (storeId && String(storeId).toUpperCase() !== 'ALL' && !isNaN(Number(storeId))) {
      whereClause += ` AND b.store_id = ${Number(storeId)}`;
    }

    const sql = `
      SELECT 
        COUNT(sr.id) AS totalRecords,
        COALESCE(SUM(sr.quantity_disposed), 0) AS totalQuantityDisposed,
        COALESCE(SUM(sr.cost_loss), 0) AS totalCostLoss,
        COALESCE(SUM(CASE WHEN sr.reason IN ('EXPIRED', 'EXP_SPOILAGE') THEN sr.cost_loss ELSE 0 END), 0) AS expiredCostLoss,
        COALESCE(SUM(CASE WHEN sr.reason IN ('DAMAGED', 'PKG_DAMAGE') THEN sr.cost_loss ELSE 0 END), 0) AS damagedCostLoss,
        COALESCE(SUM(CASE WHEN sr.reason IN ('SPOILED', 'TEMP_ABUSE') THEN sr.cost_loss ELSE 0 END), 0) AS spoiledCostLoss,
        COALESCE(SUM(CASE WHEN sr.reason = 'INTERNAL_SHRINK' THEN sr.cost_loss ELSE 0 END), 0) AS internalShrinkCostLoss,
        COALESCE(SUM(CASE WHEN sr.reason = 'DONATION' THEN sr.cost_loss ELSE 0 END), 0) AS donationCostLoss,
        COALESCE(SUM(CASE WHEN sr.reason IN ('EXPIRED', 'EXP_SPOILAGE') THEN 1 ELSE 0 END), 0) AS expSpoilageCount,
        COALESCE(SUM(CASE WHEN sr.reason IN ('DAMAGED', 'PKG_DAMAGE') THEN 1 ELSE 0 END), 0) AS pkgDamageCount,
        COALESCE(SUM(CASE WHEN sr.reason IN ('SPOILED', 'TEMP_ABUSE') THEN 1 ELSE 0 END), 0) AS tempAbuseCount,
        COALESCE(SUM(CASE WHEN sr.reason = 'INTERNAL_SHRINK' THEN 1 ELSE 0 END), 0) AS internalShrinkCount,
        COALESCE(SUM(CASE WHEN sr.reason = 'DONATION' THEN 1 ELSE 0 END), 0) AS donationCount
      FROM spoilage_records sr
      INNER JOIN batches b ON sr.batch_id = b.id
      WHERE ${whereClause};
    `;
    const rows = await SqlConnection.queryJson(sql);
    const row = rows.length > 0 ? rows[0] : { totalRecords: 0, totalQuantityDisposed: 0, totalCostLoss: 0 };
    const totalLoss = Number(row.totalCostLoss || 0);
    const pct = (val) => (totalLoss > 0 ? Number(((Number(val || 0) / totalLoss) * 100).toFixed(1)) : 0);

    row.reasonBreakdown = [
      {
        code: 'EXP_SPOILAGE',
        label: 'Quá hạn sử dụng tự nhiên (Date / Shelf-life Expiration)',
        count: Number(row.expSpoilageCount || 0),
        costLoss: Number(row.expiredCostLoss || 0),
        sharePercent: pct(row.expiredCostLoss)
      },
      {
        code: 'PKG_DAMAGE',
        label: 'Lỗi bao bì / Rách móp khi vận chuyển & trưng bày (Packaging Damage)',
        count: Number(row.pkgDamageCount || 0),
        costLoss: Number(row.damagedCostLoss || 0),
        sharePercent: pct(row.damagedCostLoss)
      },
      {
        code: 'TEMP_ABUSE',
        label: 'Đứt gãy chuỗi lạnh / Sự cố tủ mát bảo quản (Cold-Chain Failure)',
        count: Number(row.tempAbuseCount || 0),
        costLoss: Number(row.spoiledCostLoss || 0),
        sharePercent: pct(row.spoiledCostLoss)
      },
      {
        code: 'INTERNAL_SHRINK',
        label: 'Hao hụt kiểm kê nội bộ / Rơi vỡ thao tác (Internal Operational Shrink)',
        count: Number(row.internalShrinkCount || 0),
        costLoss: Number(row.internalShrinkCostLoss || 0),
        sharePercent: pct(row.internalShrinkCostLoss)
      },
      {
        code: 'DONATION',
        label: 'Chuyển quyên góp thực phẩm / Thu hồi nhân đạo (Food Bank / Donation)',
        count: Number(row.donationCount || 0),
        costLoss: Number(row.donationCostLoss || 0),
        sharePercent: pct(row.donationCostLoss)
      }
    ];
    return row;
  }

  /**
   * Lấy Top sản phẩm phát sinh hao hụt tài chính nhiều nhất (Mục 11.2 Đặc tả SSOT)
   */
  async getTopSpoilageProducts(limit = 5) {
    const sql = `
      SELECT TOP (${Number(limit)})
        p.id AS productId,
        p.sku AS productSku,
        p.name AS productName,
        p.unit AS unit,
        c.name AS categoryName,
        COUNT(sr.id) AS disposalCount,
        COALESCE(SUM(sr.quantity_disposed), 0) AS totalQuantityDisposed,
        COALESCE(SUM(sr.cost_loss), 0) AS totalCostLoss
      FROM spoilage_records sr
      INNER JOIN batches b ON sr.batch_id = b.id
      INNER JOIN products p ON b.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      GROUP BY p.id, p.sku, p.name, p.unit, c.name
      ORDER BY SUM(sr.cost_loss) DESC, SUM(sr.quantity_disposed) DESC;
    `;
    return await SqlConnection.queryJson(sql);
  }

  /**
   * Lấy xu hướng chi phí tiêu hủy hao hụt trong N ngày gần nhất phục vụ biểu đồ Trend
   */
  async getDailySpoilageTrend(days = 14) {
    const safeDays = Number(days);
    const sql = `
      SELECT 
        CONVERT(VARCHAR(10), disposed_date, 23) AS disposedDate,
        COALESCE(SUM(cost_loss), 0) AS totalCostLoss,
        COALESCE(SUM(quantity_disposed), 0) AS totalQuantityDisposed,
        COUNT(id) AS recordCount
      FROM spoilage_records
      WHERE disposed_date >= DATEADD(day, -${safeDays - 1}, CAST(GETDATE() AS DATE))
      GROUP BY disposed_date
      ORDER BY disposed_date ASC;
    `;
    return await SqlConnection.queryJson(sql);
  }
}

module.exports = SqlSpoilageRepository;
