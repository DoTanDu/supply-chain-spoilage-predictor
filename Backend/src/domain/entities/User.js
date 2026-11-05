// src/domain/entities/User.js
class User {
  constructor({ id, username, fullName, email, phone, roleId, roleCode, storeId = null, isActive = true, lastLogin, createdAt, updatedAt }) {
    this.id = id;
    this.username = username;
    this.fullName = fullName;
    this.email = email;
    this.phone = phone;
    this.roleId = roleId;
    this.roleCode = roleCode; // 'ADMIN', 'STORE_MANAGER', 'CASHIER'
    this.storeId = storeId;
    this.isActive = Boolean(isActive);
    this.lastLogin = lastLogin;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt;
  }

  hasRole(requiredRoles) {
    if (!Array.isArray(requiredRoles)) {
      requiredRoles = [requiredRoles];
    }
    return requiredRoles.includes(this.roleCode);
  }

  toSafeProfile() {
    return {
      id: this.id,
      username: this.username,
      fullName: this.fullName,
      email: this.email,
      phone: this.phone,
      roleId: this.roleId,
      roleCode: this.roleCode,
      storeId: this.storeId,
      isActive: this.isActive,
      lastLogin: this.lastLogin
    };
  }
}

module.exports = User;
