// src/domain/interfaces/IProductRepository.js
class IProductRepository {
  async findAll() { throw new Error('Not implemented'); }
  async findById(id) { throw new Error('Not implemented'); }
  async findBySku(sku) { throw new Error('Not implemented'); }
  async create(product) { throw new Error('Not implemented'); }
  async update(id, product) { throw new Error('Not implemented'); }
}

module.exports = IProductRepository;
