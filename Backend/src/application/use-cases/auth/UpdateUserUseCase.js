// src/application/use-cases/auth/UpdateUserUseCase.js

const {
  validatePagePermissionsInput,
  normalizePagePermissions
} = require('../../../domain/constants/pagePermissions');

class UpdateUserUseCase {
  constructor(userRepository, auditLogRepository) {
    this.userRepository = userRepository;
    this.auditLogRepository = auditLogRepository;
  }

  async execute({ targetUserId, fullName, email, phone, roleCode, roleId, storeId, pagePermissions, performedBy, ipAddress = '127.0.0.1' }) {
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

    const validRoles = ['ADMIN', 'STORE_MANAGER', 'CASHIER'];
    const normalizedRoleCode = roleCode ? ((roleCode.toUpperCase() === 'WAREHOUSE_STAFF' || roleCode.toUpperCase() === 'STAFF') ? 'CASHIER' : roleCode.toUpperCase()) : undefined;
    if (normalizedRoleCode && !validRoles.includes(normalizedRoleCode)) {
      throw new Error(`Vai trò không hợp lệ. Hệ thống chỉ hỗ trợ 3 vai trò: ${validRoles.join(', ')}.`);
    }

    const effectiveRoleCode = normalizedRoleCode || targetUser.roleCode;
    let nextStoreId = undefined;
    if (effectiveRoleCode === 'ADMIN') {
      nextStoreId = null;
    } else if (storeId !== undefined) {
      if (storeId === null || String(storeId).trim() === '') {
        nextStoreId = targetUser.storeId || 1;
      } else {
        const parsedStore = Number(storeId);
        if (!Number.isInteger(parsedStore) || parsedStore <= 0) {
          throw new Error(`Mã chi nhánh (storeId) không hợp lệ: [${storeId}].`);
        }
        nextStoreId = parsedStore;
      }
    } else if (!targetUser.storeId) {
      nextStoreId = 1;
    }

    let nextPagePermissions = undefined;
    if (pagePermissions !== undefined) {
      const checkPerms = validatePagePermissionsInput(pagePermissions, effectiveRoleCode);
      if (!checkPerms.ok) {
        throw new Error(checkPerms.message);
      }
      const rawRevokeCount = Array.isArray(pagePermissions?.revoke) ? pagePermissions.revoke.length : 0;
      if (performedBy.id === targetId && (checkPerms.value.revoke.length > 0 || rawRevokeCount > 0)) {
        throw new Error('Quản trị viên không thể tự thu hồi quyền truy cập trang của chính mình.');
      }
      nextPagePermissions = checkPerms.value;
    } else if (normalizedRoleCode && normalizedRoleCode !== targetUser.roleCode) {
      // Nếu đổi vai trò mà không gửi pagePermissions mới -> chuẩn hóa lại theo vai trò mới
      nextPagePermissions = normalizePagePermissions(targetUser.pagePermissions, effectiveRoleCode);
    }

    const oldRole = targetUser.roleCode;
    const oldName = targetUser.fullName;
    const oldStoreId = targetUser.storeId;
    const oldPerms = targetUser.pagePermissions || { grant: [], revoke: [] };

    const updatedUser = await this.userRepository.updateProfile(targetId, {
      fullName: fullName !== undefined ? fullName.trim() : undefined,
      email: email !== undefined ? (email ? email.trim() : null) : undefined,
      phone: phone !== undefined ? (phone ? phone.trim() : null) : undefined,
      roleId,
      roleCode: normalizedRoleCode,
      storeId: nextStoreId,
      pagePermissions: nextPagePermissions
    });

    // Ghi nhận vết kiểm toán bất biến (Rule 11 SSOT)
    if (this.auditLogRepository) {
      try {
        const changes = [];
        if (fullName && fullName.trim() !== oldName) {
          changes.push(`Họ tên: "${oldName}" ➔ "${fullName.trim()}"`);
        }
        if (normalizedRoleCode && normalizedRoleCode !== oldRole) {
          changes.push(`Vai trò: [${oldRole}] ➔ [${normalizedRoleCode}]`);
        }
        if (nextStoreId !== undefined && Number(nextStoreId || 0) !== Number(oldStoreId || 0)) {
          changes.push(`Chi nhánh: [#${oldStoreId ?? 'Chuỗi'}] ➔ [#${nextStoreId ?? 'Chuỗi'}]`);
        }
        if (nextPagePermissions !== undefined && JSON.stringify(nextPagePermissions) !== JSON.stringify(oldPerms)) {
          const grantTxt = nextPagePermissions.grant.length ? `+Cấp:[${nextPagePermissions.grant.join(',')}]` : 'Không cấp thêm';
          const revokeTxt = nextPagePermissions.revoke.length ? `-Tắt:[${nextPagePermissions.revoke.join(',')}]` : 'Không tắt bớt';
          changes.push(`Phân quyền trang: ${grantTxt}, ${revokeTxt}`);
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
