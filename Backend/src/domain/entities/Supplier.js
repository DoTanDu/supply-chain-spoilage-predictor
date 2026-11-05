// src/domain/entities/Supplier.js
/**
 * Entity Nhà cung ứng / Trung tâm Phân phối Kho tổng DC Biên Hòa
 */
class Supplier {
  constructor({
    id,
    code,
    name,
    contactName = '',
    phone = '',
    email = '',
    address = '',
    leadTimeDays = 1,
    isActive = true,
    createdAt = new Date(),
    productCount = 0,
    poCount = 0
  }) {
    if (!name) {
      throw new Error('Tên nhà cung cấp / Trung tâm phân phối là bắt buộc.');
    }
    this.id = id ? Number(id) : null;
    this.code = (code || '').trim().toUpperCase();
    this.name = (name || '').trim();
    this.contactName = String(contactName || '');
    this.phone = String(phone || '');
    this.email = String(email || '');
    this.address = String(address || '');
    this.leadTimeDays = Number(leadTimeDays) || 1;
    this.isActive = Boolean(isActive);
    this.createdAt = new Date(createdAt);
    this.productCount = Number(productCount) || 0;
    this.poCount = Number(poCount) || 0;
  }

  isDistributionCenter() {
    return this.code.startsWith('DC') || this.name.toLowerCase().includes('kho tổng') || this.name.toLowerCase().includes('phân phối');
  }

  getLeadTime() {
    return Math.max(1, this.leadTimeDays);
  }
}

module.exports = Supplier;
