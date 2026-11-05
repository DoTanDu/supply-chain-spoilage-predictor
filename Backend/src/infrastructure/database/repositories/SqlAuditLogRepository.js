// src/infrastructure/database/repositories/SqlAuditLogRepository.js
const SqlConnection = require('../sqlConnection');
const IAuditLogRepository = require('../../../domain/interfaces/IAuditLogRepository');

class SqlAuditLogRepository extends IAuditLogRepository {
  async log({ userId, userName, action, entityName, entityId, description, ipAddress = '127.0.0.1' }) {
    const safeUserId = userId ? Number(userId) : 'NULL';
    const safeDesc = SqlConnection.escapeSql(
      userName ? `[${userName}] ${description}` : description
    );
    const safeIp = SqlConnection.escapeSql(ipAddress);
    const safeAction = SqlConnection.escapeSql(action || 'INFO');
    const safeEntityName = entityName ? SqlConnection.escapeSql(entityName) : 'NULL';
    const safeEntityId = entityId ? SqlConnection.escapeSql(String(entityId)) : 'NULL';

    const sql = `
      INSERT INTO system_audit_logs (user_id, action_type, entity_name, entity_id, description, ip_address, created_at)
      VALUES (${safeUserId}, ${safeAction}, ${safeEntityName}, ${safeEntityId}, ${safeDesc}, ${safeIp}, GETDATE());
    `;
    try {
      await SqlConnection.executeSql(sql);
    } catch (err) {
      console.error('AuditLog error:', err.message);
    }
  }

  async record(data = {}) {
    return this.log({
      userId: data.userId,
      userName: data.username || data.userName,
      action: data.actionType || data.action || 'INFO',
      entityName: data.tableName || data.entityName,
      entityId: data.recordId || data.entityId,
      description: data.notes || data.description || `Ghi vết thao tác ${data.actionType || 'INFO'}`,
      ipAddress: data.ipAddress
    });
  }

  async findRecent(limit = 50) {
    const sql = `
      SELECT TOP (${Number(limit)})
        id,
        user_id AS userId,
        action_type AS actionType,
        entity_name AS entityName,
        entity_id AS entityId,
        description,
        ip_address AS ipAddress,
        created_at AS createdAt
      FROM system_audit_logs
      ORDER BY id DESC
    `;
    return await SqlConnection.queryJson(sql);
  }
}

module.exports = SqlAuditLogRepository;
