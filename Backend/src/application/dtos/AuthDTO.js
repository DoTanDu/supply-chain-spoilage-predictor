// src/application/dtos/AuthDTO.js
class AuthDTO {
  static toResponse(user, token) {
    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        roleCode: user.roleCode,
        roleName: AuthDTO.getRoleName(user.roleCode),
        isActive: user.isActive
      }
    };
  }

  static getRoleName(code) {
    switch (code) {
      case 'ADMIN': return 'Chủ chuỗi / Quản trị viên';
      case 'STORE_MANAGER': return 'Cửa hàng trưởng';
      case 'CASHIER':
      case 'WAREHOUSE_STAFF':
      case 'STAFF':
        return 'Nhân viên cửa hàng (POS & Kho kệ)';
      default: return 'Nhân viên cửa hàng';
    }
  }
}

module.exports = AuthDTO;
