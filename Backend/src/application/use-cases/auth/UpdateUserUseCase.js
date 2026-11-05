// src/application/use-cases/auth/UpdateUserUseCase.js

class UpdateUserUseCase {
  constructor(userRepository, auditLogRepository) {
    this.userRepository = userRepository;
    this.auditLogRepository = auditLogRepository;
  }

  async execute({ targetUserId, fullName, email, phone, roleCode, roleId, performedBy, ipAddress = '127.0.0.1' }) {
    if (!performedBy || performedBy.roleCode !== 'ADMIN') {
      throw new Error('Chỉ Quản trị viên (Admin) mới có quyền chỉnh sửa thông tin tài khoản nhân sự.');
    }

    if (!targetUserId) {
      throw new Error('Không xác định được mã tài khoản nhân sự cần cập nhật.');
    }

    const targetId = Number(targetUserId);

    if (fullName !== undefined && (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2)) {
      throw new Error('Họ và tên nhân viên phải có ít nhất 2 ký tự.');
    }

    const targetUser = await this.userRepository.findById(targetId);
    if (!targetUser) {
      throw new Error('Không tìm thấy tài khoản nhân sự trong cơ sở dữ liệu.');
    }

    // Ngăn chặn admin tự hạ quyền của chính mình
    if (performedBy.id === targetId && roleCode && roleCode.toUpperCase() !== 'ADMIN') {
      throw new Error('Quản trị viên không thể tự thay đổi vai trò của chính mình để tránh mất quyền quản trị hệ thống.');
    }

    const validRoles = ['ADMIN', 'STORE_MANAGER', 'CASHIER', 'WAREHOUSE_STAFF'];
    if (roleCode && !validRoles.includes(roleCode.toUpperCase())) {
      throw new Error(`Vai trò không hợp lệ. Hệ thống chỉ hỗ trợ: ${validRoles.join(', ')}.`);
    }

    const oldRole = targetUser.roleCode;
    const oldName = targetUser.fullName;

    const updatedUser = await this.userRepository.updateProfile(targetId, {
      fullName: fullName !== undefined ? fullName.trim() : undefined,
      email: email !== undefined ? (email ? email.trim() : null) : undefined,
      phone: phone !== undefined ? (phone ? phone.trim() : null) : undefined,
      roleId,
      roleCode
    });

    // Ghi nhận vết kiểm toán bất biến (Rule 11 SSOT)
    if (this.auditLogRepository) {
      try {
        const changes = [];
        if (fullName && fullName.trim() !== oldName) {
          changes.push(`Họ tên: "${oldName}" ➔ "${fullName.trim()}"`);
        }
        if (roleCode && roleCode.toUpperCase() !== oldRole) {
          changes.push(`Vai trò: [${oldRole}] ➔ [${roleCode.toUpperCase()}]`);
        }
        if (email !== undefined) {
          changes.push(`Email: "${email || 'Trống'}"`);
        }
        if (phone !== undefined) {
          changes.push(`SĐT: "${phone || 'Trống'}"`);
        }

        const changeDesc = changes.length > 0 ? changes.join(' | ') : 'Cập nhật thông tin hồ sơ';
        const adminName = performedBy.fullName || performedBy.username || 'Quản trị viên';

        await this.auditLogRepository.log({
          userId: performedBy.id,
          userName: adminName,
          action: 'UPDATE_USER',
          entityName: 'users',
          entityId: String(targetId),
          description: `[Admin] Cập nhật nhân sự [@${targetUser.username}]: ${changeDesc}`,
          ipAddress
        });
      } catch (auditErr) {
        console.warn('Ghi vết AuditLog UPDATE_USER thất bại:', auditErr.message);
      }
    }

    return {
      success: true,
      message: `Đã cập nhật thông tin nhân viên "${updatedUser.fullName}" (@${updatedUser.username}) thành công.`,
      data: updatedUser.toSafeProfile()
    };
  }
}

module.exports = UpdateUserUseCase;
