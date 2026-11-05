// src/domain/interfaces/ISupplierRepository.js
/**
 * Interface Định nghĩa Hợp đồng Truy xuất Nhà cung cấp & Trung tâm Phân phối DC
 */
class ISupplierRepository {
  async findAll() {
    throw new Error('Method not implemented.');
  }

  async findById(id) {
    throw new Error('Method not implemented.');
  }

  async findByCode(code) {
    throw new Error('Method not implemented.');
  }

  async create(supplierData) {
    throw new Error('Method not implemented.');
  }

  async update(id, updateData) {
    throw new Error('Method not implemented.');
  }

  async delete(id) {
    throw new Error('Method not implemented.');
  }
}

module.exports = ISupplierRepository;
