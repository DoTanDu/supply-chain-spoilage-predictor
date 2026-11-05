// src/infrastructure/database/repositories/SqlCategoryRepository.js
const SqlConnection = require('../sqlConnection');
const Category = require('../../../domain/entities/Category');
const ICategoryRepository = require('../../../domain/interfaces/ICategoryRepository');

class SqlCategoryRepository extends ICategoryRepository {
  async findAll() {
    const sql = `
      SELECT 
        c.id, 
        c.code, 
        c.name, 
        COALESCE(c.storage_temperature, N'Nhiệt độ phòng (25°C)') AS storageTemperature,
        c.default_warning_days AS defaultWarningDays, 
        c.description, 
        c.created_at AS createdAt,
        (SELECT COUNT(*) FROM products WHERE category_id = c.id) AS productCount
      FROM categories c
      ORDER BY c.id ASC
    `;
    const res = await SqlConnection.queryJson(sql);
    return res.map(row => ({
      entity: new Category(row),
      productCount: row.productCount || 0
    }));
  }

  async findById(id) {
    const sql = `
      SELECT 
        c.id, 
        c.code, 
        c.name, 
        COALESCE(c.storage_temperature, N'Nhiệt độ phòng (25°C)') AS storageTemperature,
        c.default_warning_days AS defaultWarningDays, 
        c.description, 
        c.created_at AS createdAt
      FROM categories c
      WHERE c.id = ${Number(id)}
    `;
    const res = await SqlConnection.queryJson(sql);
    if (!res || !res.length) return null;
    return new Category(res[0]);
  }

  async findByCode(code) {
    const sql = `
      SELECT 
        c.id, 
        c.code, 
        c.name, 
        COALESCE(c.storage_temperature, N'Nhiệt độ phòng (25°C)') AS storageTemperature,
        c.default_warning_days AS defaultWarningDays, 
        c.description, 
        c.created_at AS createdAt
      FROM categories c
      WHERE c.code = ${SqlConnection.escapeSql(code)}
    `;
    const res = await SqlConnection.queryJson(sql);
    if (!res || !res.length) return null;
    return new Category(res[0]);
  }

  async update(id, data) {
    const updates = [];
    if (data.code !== undefined) updates.push(`code = ${SqlConnection.escapeSql(data.code)}`);
    if (data.name !== undefined) updates.push(`name = ${SqlConnection.escapeSql(data.name)}`);
    if (data.storageTemperature !== undefined) updates.push(`storage_temperature = ${SqlConnection.escapeSql(data.storageTemperature)}`);
    if (data.defaultWarningDays !== undefined) updates.push(`default_warning_days = ${Number(data.defaultWarningDays)}`);
    if (data.description !== undefined) updates.push(`description = ${SqlConnection.escapeSql(data.description)}`);

    if (updates.length === 0) return await this.findById(id);

    const sql = `
      UPDATE categories
      SET ${updates.join(', ')}
      WHERE id = ${Number(id)};
    `;
    await SqlConnection.executeSql(sql);
    return await this.findById(id);
  }

  async delete(id) {
    const checkSql = `SELECT COUNT(*) AS cnt FROM products WHERE category_id = ${Number(id)};`;
    const checkRes = await SqlConnection.queryJson(checkSql);
    const count = checkRes && checkRes[0] ? checkRes[0].cnt : 0;
    if (count > 0) {
      throw new Error(`Không thể xóa ngành hàng vì đang có ${count} sản phẩm thuộc ngành này. Vui lòng chuyển hoặc ngừng kinh doanh các sản phẩm trước.`);
    }

    const sql = `DELETE FROM categories WHERE id = ${Number(id)};`;
    await SqlConnection.executeSql(sql);
    return true;
  }

  async create(category) {
    const safeCode = SqlConnection.escapeSql(category.code);
    const safeName = SqlConnection.escapeSql(category.name);
    const safeTemp = SqlConnection.escapeSql(category.storageTemperature || 'Nhiệt độ phòng (25°C)');
    const safeDays = Number(category.defaultWarningDays) || 7;
    const safeDesc = SqlConnection.escapeSql(category.description || '');

    const sql = `
      DECLARE @tmpCat TABLE (id INT);
      INSERT INTO categories (code, name, storage_temperature, default_warning_days, description, created_at)
      OUTPUT INSERTED.id INTO @tmpCat
      VALUES (${safeCode}, ${safeName}, ${safeTemp}, ${safeDays}, ${safeDesc}, GETDATE());
      SELECT id FROM @tmpCat FOR JSON PATH;
    `;
    const res = await SqlConnection.queryJson(sql);
    const newId = res && res[0] ? res[0].id : null;
    return await this.findById(newId);
  }

  /**
   * Thống kê toàn diện cơ cấu rủi ro tồn kho và hao hụt theo từng ngành hàng FMCG cho Dashboard
   */
  async getCategoryBreakdown() {
    const sql = `
      SELECT 
        c.id AS categoryId,
        c.code AS categoryCode,
        c.name AS categoryName,
        COALESCE(c.storage_temperature, N'Nhiệt độ phòng (25°C)') AS storageTemperature,
        c.default_warning_days AS defaultWarningDays,
        COUNT(DISTINCT p.id) AS productCount,
        COUNT(DISTINCT CASE WHEN b.status IN ('ACTIVE', 'WARNING') AND b.current_quantity > 0 THEN b.id ELSE NULL END) AS activeBatchCount,
        COALESCE(SUM(CASE WHEN b.status IN ('ACTIVE', 'WARNING') AND b.current_quantity > 0 THEN b.current_quantity ELSE 0 END), 0) AS totalStock,
        COALESCE(SUM(CASE WHEN b.status IN ('ACTIVE', 'WARNING') AND b.current_quantity > 0 THEN b.current_quantity * b.import_price ELSE 0 END), 0) AS inventoryValue,
        COALESCE(SUM(CASE WHEN (DATEDIFF(day, GETDATE(), b.expiry_date) <= COALESCE(c.default_warning_days, 7) OR b.status = 'WARNING') AND b.current_quantity > 0 THEN b.current_quantity * b.import_price ELSE 0 END), 0) AS atRiskValue,
        COALESCE((
          SELECT SUM(sr.cost_loss)
          FROM spoilage_records sr
          INNER JOIN batches sb ON sr.batch_id = sb.id
          INNER JOIN products sp ON sb.product_id = sp.id
          WHERE sp.category_id = c.id
        ), 0) AS totalSpoilageLoss
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      LEFT JOIN batches b ON b.product_id = p.id AND b.current_quantity > 0 AND b.status IN ('ACTIVE', 'WARNING')
      GROUP BY c.id, c.code, c.name, c.storage_temperature, c.default_warning_days
      ORDER BY c.id ASC;
    `;
    return await SqlConnection.queryJson(sql);
  }
}

module.exports = SqlCategoryRepository;
