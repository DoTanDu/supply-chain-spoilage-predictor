// src/infrastructure/database/repositories/SqlProductRepository.js
const SqlConnection = require('../sqlConnection');
const Product = require('../../../domain/entities/Product');
const IProductRepository = require('../../../domain/interfaces/IProductRepository');

class SqlProductRepository extends IProductRepository {
  async findAll() {
    const sql = `
      SELECT 
        p.id,
        p.sku,
        p.name,
        p.normalized_name AS normalizedName,
        p.category_id AS categoryId,
        c.name AS categoryName,
        COALESCE(c.storage_temperature, N'Nhiệt độ phòng (25°C)') AS storageTemperature,
        COALESCE(c.default_warning_days, 7) AS categoryDefaultWarningDays,
        p.default_supplier_id AS supplierId,
        sup.name AS supplierName,
        p.unit,
        p.cost_price AS costPrice,
        p.selling_price AS sellingPrice,
        p.standard_shelf_life_days AS standardShelfLifeDays,
        p.min_stock_level AS minStockLevel,
        p.max_stock_level AS maxStockLevel,
        p.custom_warning_days AS customWarningDays,
        p.image_url AS imageUrl,
        p.is_active AS isActive,
        p.created_at AS createdAt,
        ISNULL((SELECT SUM(current_quantity) FROM batches WHERE product_id = p.id AND status != 'EXPIRED' AND current_quantity > 0), 0) AS totalStock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers sup ON p.default_supplier_id = sup.id
      WHERE p.is_active = 1
      ORDER BY p.id ASC
    `;
    const res = await SqlConnection.queryJson(sql);
    return res.map(row => ({
      entity: new Product(row),
      totalStock: row.totalStock || 0
    }));
  }

  async findById(id) {
    const sql = `
      SELECT 
        p.id,
        p.sku,
        p.name,
        p.normalized_name AS normalizedName,
        p.category_id AS categoryId,
        c.name AS categoryName,
        COALESCE(c.storage_temperature, N'Nhiệt độ phòng (25°C)') AS storageTemperature,
        COALESCE(c.default_warning_days, 7) AS categoryDefaultWarningDays,
        p.default_supplier_id AS supplierId,
        sup.name AS supplierName,
        p.unit,
        p.cost_price AS costPrice,
        p.selling_price AS sellingPrice,
        p.standard_shelf_life_days AS standardShelfLifeDays,
        p.min_stock_level AS minStockLevel,
        p.max_stock_level AS maxStockLevel,
        p.custom_warning_days AS customWarningDays,
        p.image_url AS imageUrl,
        p.is_active AS isActive,
        p.created_at AS createdAt,
        ISNULL((SELECT SUM(current_quantity) FROM batches WHERE product_id = p.id AND status != 'EXPIRED' AND current_quantity > 0), 0) AS totalStock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers sup ON p.default_supplier_id = sup.id
      WHERE p.id = ${Number(id)}
    `;
    const res = await SqlConnection.queryJson(sql);
    if (!res || !res.length) return null;
    return new Product(res[0]);
  }

  async findBySku(sku) {
    const safeSku = SqlConnection.escapeSql((sku || '').trim().toUpperCase());
    const sql = `
      SELECT 
        p.id,
        p.sku,
        p.name,
        p.normalized_name AS normalizedName,
        p.category_id AS categoryId,
        p.default_supplier_id AS supplierId,
        p.unit,
        p.cost_price AS costPrice,
        p.selling_price AS sellingPrice,
        p.standard_shelf_life_days AS standardShelfLifeDays
      FROM products p
      WHERE p.sku = ${safeSku}
    `;
    const res = await SqlConnection.queryJson(sql);
    if (!res || !res.length) return null;
    return new Product(res[0]);
  }

  async create(product) {
    const safeSku = SqlConnection.escapeSql(product.sku);
    const safeName = SqlConnection.escapeSql(product.name);
    const safeNorm = SqlConnection.escapeSql(product.normalizedName || Product.normalize(product.name));
    const safeCat = Number(product.categoryId);
    const safeSup = Number(product.supplierId || 1);
    const safeUnit = SqlConnection.escapeSql(product.unit || 'Hộp');
    const safeCost = Number(product.costPrice) || 0;
    const safePrice = Number(product.sellingPrice) || 0;
    const safeShelf = Number(product.standardShelfLifeDays) || 30;
    const safeMin = Number(product.minStockLevel) || 15;
    const safeMax = Number(product.maxStockLevel) || 150;
    const safeCustomWarn = product.customWarningDays !== null && product.customWarningDays !== undefined ? Number(product.customWarningDays) : 'NULL';
    const safeImg = SqlConnection.escapeSql(product.imageUrl || '📦');

    const sql = `
      INSERT INTO products (
        sku, name, normalized_name, category_id, default_supplier_id, unit,
        cost_price, selling_price, standard_shelf_life_days, min_stock_level, max_stock_level,
        custom_warning_days, image_url, is_active, created_at, updated_at
      ) VALUES (
        ${safeSku}, ${safeName}, ${safeNorm}, ${safeCat}, ${safeSup}, ${safeUnit},
        ${safeCost}, ${safePrice}, ${safeShelf}, ${safeMin}, ${safeMax},
        ${safeCustomWarn}, ${safeImg}, 1, GETDATE(), GETDATE()
      );
    `;
    await SqlConnection.executeSql(sql);
    return await this.findBySku(product.sku);
  }

  async update(id, data) {
    const pId = Number(id);
    const updates = [];
    if (data.sku !== undefined) {
      updates.push(`sku = ${SqlConnection.escapeSql(String(data.sku).trim().toUpperCase())}`);
    }
    if (data.name !== undefined) {
      updates.push(`name = ${SqlConnection.escapeSql(data.name)}`);
      updates.push(`normalized_name = ${SqlConnection.escapeSql(Product.normalize(data.name))}`);
    }
    if (data.categoryId !== undefined) {
      updates.push(`category_id = ${Number(data.categoryId)}`);
    }
    if (data.supplierId !== undefined) {
      updates.push(`default_supplier_id = ${Number(data.supplierId)}`);
    }
    if (data.unit !== undefined) {
      updates.push(`unit = ${SqlConnection.escapeSql(data.unit)}`);
    }
    if (data.costPrice !== undefined) {
      updates.push(`cost_price = ${Number(data.costPrice)}`);
    }
    if (data.sellingPrice !== undefined) {
      updates.push(`selling_price = ${Number(data.sellingPrice)}`);
    }
    if (data.standardShelfLifeDays !== undefined) {
      updates.push(`standard_shelf_life_days = ${Number(data.standardShelfLifeDays)}`);
    }
    if (data.minStockLevel !== undefined) {
      updates.push(`min_stock_level = ${Number(data.minStockLevel)}`);
    }
    if (data.maxStockLevel !== undefined) {
      updates.push(`max_stock_level = ${Number(data.maxStockLevel)}`);
    }
    if (data.customWarningDays !== undefined) {
      updates.push(`custom_warning_days = ${data.customWarningDays !== null ? Number(data.customWarningDays) : 'NULL'}`);
    }
    if (data.imageUrl !== undefined) {
      updates.push(`image_url = ${SqlConnection.escapeSql(data.imageUrl)}`);
    }
    if (data.isActive !== undefined) {
      updates.push(`is_active = ${data.isActive ? 1 : 0}`);
    }
    updates.push('updated_at = GETDATE()');

    if (updates.length > 1) {
      const sql = `
        UPDATE products
        SET ${updates.join(', ')}
        WHERE id = ${pId};
      `;
      await SqlConnection.executeSql(sql);
    }
    return await this.findById(pId);
  }
}

module.exports = SqlProductRepository;
