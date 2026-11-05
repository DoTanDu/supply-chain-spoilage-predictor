// src/application/use-cases/auth/ResetPasswordUseCase.js
const PasswordHasher = require('../../../infrastructure/security/PasswordHasher');

class ResetPasswordUseCase {
  constructor(userRepository, auditLogRepository) {
    this.userRepository = userRepository;
    this.auditLogRepository = auditLogRepository;
  }

  async execute({ targetUserId, newPassword, confirmPassword, performedBy, ipAddress = '127.0.0.1' }) {
    if (!performedBy || performedBy.roleCode !== 'ADMIN') {
      throw new Error('Chỉ Quản trị viên (Admin) mới có quyền đặt lại mật khẩu cho nhân sự.');
    }

    if (!targetUserId) {
      throw new Error('Không xác định được mã tài khoản nhân sự cần đặt lại mật khẩu.');
    }

    const targetId = Number(targetUserId);

    if (performedBy.id === targetId) {
      throw new Error('Quản trị viên vui lòng sử dụng chức năng "Đổi mật khẩu cá nhân" để thay đổi mật khẩu của chính mình.');
    }

    if (!newPassword) {
      throw new Error('Vui lòng nhập mật khẩu mới.');
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      throw new Error('Mật khẩu mới phải có độ dài tối thiểu 6 ký tự để đảm bảo an toàn.');
    }

    if (confirmPassword !== undefined && confirmPassword !== null && newPassword !== confirmPassword) {
      throw new Error('Xác nhận mật khẩu mới không trùng khớp.');
    }

    const targetUser = await this.userRepository.findById(targetId);
    if (!targetUser) {
      throw new Error('Không tìm thấy tài khoản nhân sự trong cơ sở dữ liệu.');
    }

    // Băm mật khẩu mới bằng bcrypt 10 salt rounds
    const passwordHash = await PasswordHasher.hash(newPassword);
    await this.userRepository.updatePassword(targetId, passwordHash);

    // Ghi vết kiểm toán bất biến (Rule 11 SSOT)
    if (this.auditLogRepository) {
      try {
        const adminName = performedBy.fullName || performedBy.username || 'Quản trị viên';
        await this.auditLogRepository.log({
          userId: performedBy.id,
          userName: adminName,
          action: 'RESET_PASSWORD',
          entityName: 'users',
          entityId: String(targetId),
          description: `[Admin] Đặt lại mật khẩu cho nhân sự: [${targetUser.username}] (${targetUser.fullName}) - Vai trò: [${targetUser.roleCode}]`,
          ipAddress
        });
      } catch (auditErr) {
        console.warn('Ghi vết AuditLog RESET_PASSWORD thất bại:', auditErr.message);
      }
    }

    return {
      success: true,
      message: `Đã đặt lại mật khẩu thành công cho nhân viên "${targetUser.fullName}" (${targetUser.username}).`,
      targetUserId: targetId,
      username: targetUser.username,
      fullName: targetUser.fullName
    };
  }
}

module.exports = ResetPasswordUseCase;
