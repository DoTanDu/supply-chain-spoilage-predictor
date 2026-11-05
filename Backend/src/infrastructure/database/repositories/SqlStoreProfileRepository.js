// src/infrastructure/database/repositories/SqlStoreProfileRepository.js
const SqlConnection = require('../sqlConnection');
const StoreProfile = require('../../../domain/entities/StoreProfile');
const IStoreProfileRepository = require('../../../domain/interfaces/IStoreProfileRepository');

class SqlStoreProfileRepository extends IStoreProfileRepository {
  async getProfile(storeId = 1) {
    const safeStoreId = Number(storeId) || 1;
    const sql = `
      SELECT TOP 1
        s.id,
        ISNULL(s.store_code, N'RETAIL-STORE-01') AS storeCode,
        s.store_name AS storeName,
        s.address,
        s.phone,
        ISNULL(s.manager_id, 4) AS managerId,
        u.full_name AS managerName,
        s.default_dc_supplier_id AS defaultDcSupplierId,
        sup.name AS defaultDcSupplierName,
        s.default_lead_time_days AS defaultLeadTimeDays,
        s.min_inbound_rsl_percent AS minInboundRslPercent,
        s.default_warning_days AS defaultWarningDays,
        s.critical_warning_days AS criticalWarningDays,
        ISNULL(s.open_time, N'06:00') AS openTime,
        ISNULL(s.close_time, N'22:00') AS closeTime,
        ISNULL(s.shelf_capacity_skus, 1500) AS shelfCapacitySkus,
        ISNULL(s.shelf_capacity_units, 5000) AS shelfCapacityUnits,
        s.status,
        s.updated_at AS updatedAt
      FROM store_profile s
      LEFT JOIN users u ON ISNULL(s.manager_id, 4) = u.id
      LEFT JOIN suppliers sup ON s.default_dc_supplier_id = sup.id
      WHERE s.id = ${safeStoreId}
      ORDER BY s.id ASC
    `;
    const managersSql = `
      SELECT
        u.id,
        u.username,
        u.full_name AS fullName,
        u.phone,
        u.email
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE r.code IN ('STORE_MANAGER', 'MANAGER')
        AND u.is_active = 1
      ORDER BY u.id ASC
    `;
    const [res, managers] = await Promise.all([
      SqlConnection.queryJson(sql),
      SqlConnection.queryJson(managersSql).catch(() => [])
    ]);
    if (!res || !res.length) return null;
    return new StoreProfile({
      ...res[0],
      availableManagers: Array.isArray(managers) ? managers : []
    });
  }

  async getAllStores() {
    const sql = `
      SELECT
        s.id,
        s.store_code AS storeCode,
        s.store_name AS storeName,
        s.address,
        s.phone,
        s.manager_id AS managerId,
        u.full_name AS managerName,
        s.default_dc_supplier_id AS defaultDcSupplierId,
        sup.name AS defaultDcSupplierName,
        s.default_lead_time_days AS defaultLeadTimeDays,
        s.min_inbound_rsl_percent AS minInboundRslPercent,
        s.default_warning_days AS defaultWarningDays,
        s.critical_warning_days AS criticalWarningDays,
        s.open_time AS openTime,
        s.close_time AS closeTime,
        s.shelf_capacity_skus AS shelfCapacitySkus,
        s.shelf_capacity_units AS shelfCapacityUnits,
        s.status,
        s.updated_at AS updatedAt
      FROM store_profile s
      LEFT JOIN users u ON s.manager_id = u.id
      LEFT JOIN suppliers sup ON s.default_dc_supplier_id = sup.id
      ORDER BY s.id ASC
    `;
    return await SqlConnection.queryJson(sql);
  }

  async updateProfile(data) {
    const targetId = data.id ? Number(data.id) : 1;
    const safeName = data.storeName !== undefined ? SqlConnection.escapeSql(data.storeName) : 'store_name';
    const safeAddr = data.address !== undefined ? SqlConnection.escapeSql(data.address) : 'address';
    const safePhone = data.phone !== undefined ? SqlConnection.escapeSql(data.phone) : 'phone';
    const safeStatus = data.status !== undefined ? SqlConnection.escapeSql(data.status) : 'status';
    const safeLeadTime = data.defaultLeadTimeDays !== undefined ? Number(data.defaultLeadTimeDays) : 'default_lead_time_days';
    const safeMinRsl = data.minInboundRslPercent !== undefined ? Number(data.minInboundRslPercent) : 'min_inbound_rsl_percent';
    const safeWarnDays = data.defaultWarningDays !== undefined ? Number(data.defaultWarningDays) : 'default_warning_days';
    const safeCritDays = data.criticalWarningDays !== undefined ? Number(data.criticalWarningDays) : 'critical_warning_days';
    const safeManagerId = data.managerId !== undefined ? (data.managerId ? Number(data.managerId) : 'NULL') : 'manager_id';
    const safeOpenTime = data.openTime !== undefined ? SqlConnection.escapeSql(data.openTime) : 'open_time';
    const safeCloseTime = data.closeTime !== undefined ? SqlConnection.escapeSql(data.closeTime) : 'close_time';
    const safeSkus = data.shelfCapacitySkus !== undefined ? Number(data.shelfCapacitySkus) : 'shelf_capacity_skus';
    const safeUnits = data.shelfCapacityUnits !== undefined ? Number(data.shelfCapacityUnits) : 'shelf_capacity_units';

    const sql = `
      UPDATE store_profile
      SET 
        store_name = ${safeName},
        address = ${safeAddr},
        phone = ${safePhone},
        status = ${safeStatus},
        default_lead_time_days = ${safeLeadTime},
        min_inbound_rsl_percent = ${safeMinRsl},
        default_warning_days = ${safeWarnDays},
        critical_warning_days = ${safeCritDays},
        manager_id = ${safeManagerId},
        open_time = ${safeOpenTime},
        close_time = ${safeCloseTime},
        shelf_capacity_skus = ${safeSkus},
        shelf_capacity_units = ${safeUnits},
        updated_at = GETDATE()
      WHERE id = ${targetId};
    `;
    await SqlConnection.executeSql(sql);
    return await this.getProfile(targetId);
  }
}

module.exports = SqlStoreProfileRepository;
