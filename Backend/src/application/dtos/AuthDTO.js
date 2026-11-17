// src/application/dtos/AuthDTO.js
const {
  normalizePagePermissions,
  computeEffectivePages
} = require('../../domain/constants/pagePermissions');

class AuthDTO {
  static toResponse(user, token) {
    const pagePermissions = user.pagePermissions || normalizePagePermissions(null, user.roleCode);
    const effectivePages = Array.isArray(user.effectivePages)
      ? user.effectivePages
      : computeEffectivePages(user.roleCode, pagePermissions);
    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        roleCode: user.roleCode,
        actorCode: AuthDTO.getActorCode(user.roleCode),
        roleName: AuthDTO.getRoleName(user.roleCode),
        storeId: user.storeId || null,
        pagePermissions,
        effectivePages,
        isActive: user.isActive
      }
    };
  }

  static getActorCode(code) {
    switch (code) {
      case 'ADMIN':
      case 'OWNER':
        return 'OWNER';
      case 'STORE_MANAGER':
      case 'MANAGER':
        return 'MANAGER';
      default:
        return 'STAFF';
    }
  }

  static getRoleName(code) {
    switch (code) {
      case 'ADMIN':
      case 'OWNER':
        return 'OWNER - Chủ chuỗi / Quản trị hệ thống';
      case 'STORE_MANAGER':
      case 'MANAGER':
        return 'MANAGER - Quản lý cửa hàng';
      case 'CASHIER':
      case 'WAREHOUSE_STAFF':
      case 'STAFF':
        return 'STAFF - Nhân viên cửa hàng (Kho kệ & Bán hàng)';
      default:
        return 'STAFF - Nhân viên cửa hàng';
    }
  }
}

module.exports = AuthDTO;
