// src/infrastructure/database/repositories/SqlSupplierRepository.js
const SqlConnection = require('../sqlConnection');
const Supplier = require('../../../domain/entities/Supplier');
const ISupplierRepository = require('../../../domain/interfaces/ISupplierRepository');

class SqlSupplierRepository extends ISupplierRepository {
  async findAll(options = {}) {
    const includeInactive = Boolean(options.includeInactive);
    const whereClause = includeInactive ? '' : 'WHERE s.is_active = 1';

    const sql = `
      SELECT 
        s.id, 
        s.code, 
        s.name, 
        s.contact_name AS contactName,
        s.phone, 
        s.email, 
        s.address, 
        s.lead_time_days AS leadTimeDays,
        s.is_active AS isActive, 
        s.created_at AS createdAt,
        ISNULL((SELECT COUNT(*) FROM products p WHERE p.default_supplier_id = s.id AND p.is_active = 1), 0) AS productCount,
        ISNULL((SELECT COUNT(*) FROM purchase_orders po WHERE po.supplier_id = s.id), 0) AS poCount
      FROM suppliers s
      ${whereClause}
      ORDER BY s.id ASC;
    `;
    const rows = await SqlConnection.queryJson(sql);
    return rows.map(r => new Supplier(r));
  }

  async findById(id) {
    const sId = Number(id);
    if (isNaN(sId) || sId <= 0) return null;

    const sql = `
      SELECT TOP 1
        s.id, 
        s.code, 
        s.name, 
        s.contact_name AS contactName,
        s.phone, 
        s.email, 
        s.address, 
        s.lead_time_days AS leadTimeDays,
        s.is_active AS isActive, 
        s.created_at AS createdAt,
        ISNULL((SELECT COUNT(*) FROM products p WHERE p.default_supplier_id = s.id AND p.is_active = 1), 0) AS productCount,
        ISNULL((SELECT COUNT(*) FROM purchase_orders po WHERE po.supplier_id = s.id), 0) AS poCount
      FROM suppliers s
      WHERE s.id = ${sId};
    `;
    const rows = await SqlConnection.queryJson(sql);
    return rows.length > 0 ? new Supplier(rows[0]) : null;
  }

  async findByCode(code) {
    if (!code) return null;
    const safeCode = SqlConnection.escapeSql(String(code).trim().toUpperCase());
    const sql = `
      SELECT TOP 1
        s.id, 
        s.code, 
        s.name, 
        s.contact_name AS contactName,
        s.phone, 
        s.email, 
        s.address, 
        s.lead_time_days AS leadTimeDays,
        s.is_active AS isActive, 
        s.created_at AS createdAt,
        ISNULL((SELECT COUNT(*) FROM products p WHERE p.default_supplier_id = s.id AND p.is_active = 1), 0) AS productCount,
        ISNULL((SELECT COUNT(*) FROM purchase_orders po WHERE po.supplier_id = s.id), 0) AS poCount
      FROM suppliers s
      WHERE s.code = ${safeCode};
    `;
    const rows = await SqlConnection.queryJson(sql);
    return rows.length > 0 ? new Supplier(rows[0]) : null;
  }

  async create(data) {
    if (!data.name || !String(data.name).trim()) {
      throw new Error('Tên nhà cung cấp / Trung tâm phân phối là bắt buộc.');
    }
    const safeCode = SqlConnection.escapeSql(String(data.code || '').trim().toUpperCase());
    const safeName = SqlConnection.escapeSql(String(data.name).trim());
    const safeContact = SqlConnection.escapeSql(String(data.contactName || '').trim());
    const safePhone = SqlConnection.escapeSql(String(data.phone || '').trim());
    const safeEmail = SqlConnection.escapeSql(String(data.email || '').trim());
    const safeAddress = SqlConnection.escapeSql(String(data.address || '').trim());
    const safeLeadTime = Math.max(1, Number(data.leadTimeDays) || 1);
    const safeActive = data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1;

    const sql = `
      INSERT INTO suppliers (
        code, name, contact_name, phone, email, address, lead_time_days, is_active, created_at
      ) VALUES (
        ${safeCode}, ${safeName}, ${safeContact}, ${safePhone}, ${safeEmail}, ${safeAddress}, ${safeLeadTime}, ${safeActive}, GETDATE()
      );
    `;
    await SqlConnection.executeSql(sql);
    return await this.findByCode(data.code);
  }

  async update(id, data) {
    const sId = Number(id);
    if (isNaN(sId) || sId <= 0) {
      throw new Error('ID nhà cung cấp không hợp lệ.');
    }

    const updates = [];
    if (data.code !== undefined) {
      updates.push(`code = ${SqlConnection.escapeSql(String(data.code).trim().toUpperCase())}`);
    }
    if (data.name !== undefined) {
      updates.push(`name = ${SqlConnection.escapeSql(String(data.name).trim())}`);
    }
    if (data.contactName !== undefined) {
      updates.push(`contact_name = ${SqlConnection.escapeSql(String(data.contactName).trim())}`);
    }
    if (data.phone !== undefined) {
      updates.push(`phone = ${SqlConnection.escapeSql(String(data.phone).trim())}`);
    }
    if (data.email !== undefined) {
      updates.push(`email = ${SqlConnection.escapeSql(String(data.email).trim())}`);
    }
    if (data.address !== undefined) {
      updates.push(`address = ${SqlConnection.escapeSql(String(data.address).trim())}`);
    }
    if (data.leadTimeDays !== undefined) {
      updates.push(`lead_time_days = ${Math.max(1, Number(data.leadTimeDays) || 1)}`);
    }
    if (data.isActive !== undefined) {
      updates.push(`is_active = ${data.isActive ? 1 : 0}`);
    }

    if (updates.length > 0) {
      const sql = `
        UPDATE suppliers
        SET ${updates.join(', ')}
        WHERE id = ${sId};
      `;
      await SqlConnection.executeSql(sql);
    }
    return await this.findById(sId);
  }

  async delete(id) {
    const sId = Number(id);
    if (isNaN(sId) || sId <= 0) {
      throw new Error('ID nhà cung cấp không hợp lệ.');
    }

    const existing = await this.findById(sId);
    if (!existing) {
      throw new Error(`Không tìm thấy nhà cung cấp với ID [${id}].`);
    }

    if (existing.productCount > 0) {
      throw new Error(`Không thể xóa nhà cung ứng "${existing.name}" vì đang có ${existing.productCount} sản phẩm liên kết.`);
    }

    if (existing.poCount > 0) {
      throw new Error(`Không thể xóa nhà cung ứng "${existing.name}" vì đang có ${existing.poCount} đơn đặt hàng (PO) liên kết.`);
    }

    const sql = `DELETE FROM suppliers WHERE id = ${sId};`;
    await SqlConnection.executeSql(sql);
    return true;
  }
}

module.exports = SqlSupplierRepository;
