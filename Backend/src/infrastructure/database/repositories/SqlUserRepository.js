// src/infrastructure/database/repositories/SqlUserRepository.js
const SqlConnection = require('../sqlConnection');
const User = require('../../../domain/entities/User');
const IUserRepository = require('../../../domain/interfaces/IUserRepository');

class SqlUserRepository extends IUserRepository {
  async findById(id) {
    const sql = `
      SELECT 
        u.id, 
        u.username, 
        u.password_hash AS passwordHash, 
        u.full_name AS fullName, 
        u.email, 
        u.phone, 
        u.role_id AS roleId, 
        r.code AS roleCode, 
        u.store_id AS storeId,
        u.is_active AS isActive, 
        u.last_login AS lastLogin, 
        u.created_at AS createdAt, 
        u.updated_at AS updatedAt
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ${Number(id)}
    `;
    const res = await SqlConnection.queryJson(sql);
    if (!res || !res.length) return null;
    const entity = new User(res[0]);
    entity.passwordHash = res[0].passwordHash;
    return entity;
  }

  async findByUsername(username) {
    const safeUser = SqlConnection.escapeSql(username);
    const sql = `
      SELECT 
        u.id, 
        u.username, 
        u.password_hash AS passwordHash, 
        u.full_name AS fullName, 
        u.email, 
        u.phone, 
        u.role_id AS roleId, 
        r.code AS roleCode, 
        u.store_id AS storeId,
        u.is_active AS isActive, 
        u.last_login AS lastLogin, 
        u.created_at AS createdAt, 
        u.updated_at AS updatedAt
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.username = ${safeUser}
    `;
    const res = await SqlConnection.queryJson(sql);
    if (!res || !res.length) return null;
    const entity = new User(res[0]);
    entity.passwordHash = res[0].passwordHash;
    entity.entity = entity;
    return entity;
  }

  async findAll() {
    const sql = `
      SELECT 
        u.id, 
        u.username, 
        u.full_name AS fullName, 
        u.email, 
        u.phone, 
        u.role_id AS roleId, 
        r.code AS roleCode, 
        u.store_id AS storeId,
        u.is_active AS isActive, 
        u.last_login AS lastLogin, 
        u.created_at AS createdAt
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.username NOT LIKE 'test_%'
        AND u.username NOT IN ('warehouse', 'dotandu', 'doanminhquan', 'cashier2', 'cashier_ca2')
      ORDER BY u.id ASC
    `;
    const res = await SqlConnection.queryJson(sql);
    return res.map(row => new User(row));
  }

  async create({ username, passwordHash, fullName, email, phone, roleId, roleCode, storeId = 1, isActive = true }) {
    const roleMap = {
      'ADMIN': 1,
      'OWNER': 1,
      'STORE_MANAGER': 2,
      'MANAGER': 2,
      'CASHIER': 3,
      'STAFF': 3,
      'WAREHOUSE_STAFF': 4
    };
    const codeMap = {
      1: 'ADMIN',
      2: 'STORE_MANAGER',
      3: 'CASHIER',
      4: 'WAREHOUSE_STAFF'
    };

    const finalRoleCode = (roleCode || (roleId ? codeMap[Number(roleId)] : 'CASHIER')).toUpperCase();
    const finalRoleId = Number(roleId) || roleMap[finalRoleCode] || 3;
    const finalStoreId = finalRoleId === 1 ? 'NULL' : (storeId ? Number(storeId) : 1);

    const safeUser = SqlConnection.escapeSql(username ? username.trim().toLowerCase() : '');
    const safePass = SqlConnection.escapeSql(passwordHash);
    const safeName = SqlConnection.escapeSql(fullName ? fullName.trim() : '');
    const safeEmail = SqlConnection.escapeSql(email && email.trim() ? email.trim() : null);
    const safePhone = SqlConnection.escapeSql(phone && phone.trim() ? phone.trim() : null);
    const safeRoleId = finalRoleId;
    const safeActive = isActive ? 1 : 0;

    const sql = `
      DECLARE @tmp TABLE (id INT);
      INSERT INTO users (username, password_hash, full_name, email, phone, role_id, store_id, is_active, created_at, updated_at)
      OUTPUT INSERTED.id INTO @tmp
      VALUES (${safeUser}, ${safePass}, ${safeName}, ${safeEmail}, ${safePhone}, ${safeRoleId}, ${finalStoreId}, ${safeActive}, GETDATE(), GETDATE());
      SELECT 
        u.id, u.username, u.full_name AS fullName, u.email, u.phone, 
        u.role_id AS roleId, r.code AS roleCode, u.store_id AS storeId, u.is_active AS isActive, u.created_at AS createdAt
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id
      INNER JOIN @tmp t ON u.id = t.id FOR JSON PATH;
    `;
    const rows = await SqlConnection.queryJson(sql);
    return rows && rows.length ? new User(rows[0]) : null;
  }

  async updateLastLogin(id) {
    const sql = `UPDATE users SET last_login = GETDATE() WHERE id = ${Number(id)};`;
    await SqlConnection.executeSql(sql);
  }

  async updateStatus(id, isActive) {
    const safeActive = isActive ? 1 : 0;
    const sql = `
      UPDATE users 
      SET is_active = ${safeActive}, updated_at = GETDATE() 
      WHERE id = ${Number(id)};
    `;
    await SqlConnection.executeSql(sql);
    return await this.findById(id);
  }

  async updatePassword(id, passwordHash) {
    const safePass = SqlConnection.escapeSql(passwordHash);
    const sql = `
      UPDATE users 
      SET password_hash = ${safePass}, updated_at = GETDATE() 
      WHERE id = ${Number(id)};
    `;
    await SqlConnection.executeSql(sql);
    return await this.findById(id);
  }

  async updateProfile(id, { fullName, email, phone, roleId, roleCode, storeId }) {
    const roleMap = {
      'ADMIN': 1,
      'OWNER': 1,
      'STORE_MANAGER': 2,
      'MANAGER': 2,
      'CASHIER': 3,
      'STAFF': 3,
      'WAREHOUSE_STAFF': 4
    };
    const codeMap = {
      1: 'ADMIN',
      2: 'STORE_MANAGER',
      3: 'CASHIER',
      4: 'WAREHOUSE_STAFF'
    };

    const updates = [];
    if (fullName !== undefined) {
      updates.push(`full_name = ${SqlConnection.escapeSql(fullName ? fullName.trim() : '')}`);
    }
    if (email !== undefined) {
      updates.push(`email = ${SqlConnection.escapeSql(email && email.trim() ? email.trim() : null)}`);
    }
    if (phone !== undefined) {
      updates.push(`phone = ${SqlConnection.escapeSql(phone && phone.trim() ? phone.trim() : null)}`);
    }

    if (roleCode || roleId) {
      const finalRoleCode = (roleCode || (roleId ? codeMap[Number(roleId)] : 'CASHIER')).toUpperCase();
      const finalRoleId = Number(roleId) || roleMap[finalRoleCode] || 3;
      updates.push(`role_id = ${finalRoleId}`);
    }

    if (storeId !== undefined) {
      updates.push(`store_id = ${storeId ? Number(storeId) : 'NULL'}`);
    }

    if (updates.length === 0) {
      return await this.findById(id);
    }

    updates.push('updated_at = GETDATE()');
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ${Number(id)};`;
    await SqlConnection.executeSql(sql);
    return await this.findById(id);
  }
}

module.exports = SqlUserRepository;
