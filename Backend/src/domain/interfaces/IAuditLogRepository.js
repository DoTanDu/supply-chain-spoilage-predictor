// src/domain/interfaces/IAuditLogRepository.js
class IAuditLogRepository {
  async log({ userId, userName, action, entityName, entityId, description, ipAddress }) {
    throw new Error('Not implemented');
  }
  async findRecent(limit = 50) {
    throw new Error('Not implemented');
  }
}

module.exports = IAuditLogRepository;
