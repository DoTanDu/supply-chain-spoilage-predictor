// src/domain/entities/Role.js
class Role {
  constructor({ id, code, name, description, createdAt }) {
    this.id = id;
    this.code = code; // ADMIN, STORE_MANAGER, CASHIER, WAREHOUSE_STAFF
    this.name = name;
    this.description = description;
    this.createdAt = createdAt || new Date();
  }

  static CODES = {
    ADMIN: 'ADMIN',
    STORE_MANAGER: 'STORE_MANAGER',
    CASHIER: 'CASHIER',
    WAREHOUSE_STAFF: 'WAREHOUSE_STAFF'
  };

  isAdmin() {
    return this.code === Role.CODES.ADMIN;
  }

  isStoreManager() {
    return this.code === Role.CODES.STORE_MANAGER || this.isAdmin();
  }
}

module.exports = Role;
