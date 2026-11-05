// src/domain/interfaces/IUserRepository.js
class IUserRepository {
  async findById(id) { throw new Error('Not implemented'); }
  async findByUsername(username) { throw new Error('Not implemented'); }
  async findAll() { throw new Error('Not implemented'); }
  async create(user) { throw new Error('Not implemented'); }
  async updateLastLogin(id) { throw new Error('Not implemented'); }
  async updatePassword(id, passwordHash) { throw new Error('Not implemented'); }
  async updateStatus(id, isActive) { throw new Error('Not implemented'); }
}

module.exports = IUserRepository;
