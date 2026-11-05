// src/application/use-cases/auth/CreateUserUseCase.js
const PasswordHasher = require('../../../infrastructure/security/PasswordHasher');

class CreateUserUseCase {
  constructor(userRepository, auditLogRepository) {
    this.userRepository = userRepository;
    this.auditLogRepository = auditLogRepository;
  }

  async execute({ username, password, fullName, email, phone, roleCode = 'CASHIER', roleId, performedBy, ipAddress = '127.0.0.1' }) {
    // 1. Kiểm tra username
    if (!username || typeof username !== 'string' || !username.trim()) {
      throw new Error('Vui lòng nhập tên đăng nhập cho nhân sự mới.');
    }

    const cleanUsername = username.trim().toLowerCase();
    const usernameRegex = /^[a-z0-9_.-]{3,30}$/;
    if (!usernameRegex.test(cleanUsername)) {
      throw new Error('Tên đăng nhập phải có từ 3 đến 30 ký tự, chỉ chứa chữ cái thường, số, dấu gạch dưới (_) hoặc gạch nối (-).');
    }

    // Kiểm tra trùng lặp tài khoản trong CSDL
    const existing = await this.userRepository.findByUsername(cleanUsername);
    if (existing) {
      throw new Error(`Tên đăng nhập "${cleanUsername}" đã tồn tại trong hệ thống. Vui lòng chọn tên đăng nhập khác.`);
    }

    // 2. Kiểm tra họ và tên
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      throw new Error('Vui lòng nhập họ và tên nhân sự (tối thiểu 2 ký tự).');
    }

    // 3. Kiểm tra mật khẩu ban đầu
    if (!password || typeof password !== 'string' || password.length < 6) {
      throw new Error('Mật khẩu khởi tạo phải có độ dài tối thiểu 6 ký tự để đảm bảo an toàn.');
    }

    // 4. Kiểm tra vai trò RBAC hợp lệ (3 Vai trò chuẩn: ADMIN, STORE_MANAGER, CASHIER)
    const validRoles = ['ADMIN', 'STORE_MANAGER', 'CASHIER'];
    const rawRoleCode = (roleCode || 'CASHIER').toUpperCase();
    const targetRoleCode = (rawRoleCode === 'WAREHOUSE_STAFF' || rawRoleCode === 'STAFF') ? 'CASHIER' : rawRoleCode;
    if (!validRoles.includes(targetRoleCode)) {
      throw new Error('Vai trò người dùng không hợp lệ. Chỉ chấp nhận ADMIN, STORE_MANAGER hoặc CASHIER.');
    }

    // 5. Băm mật khẩu bằng bcrypt
    const passwordHash = await PasswordHasher.hash(password);

    // 6. Lưu vào cơ sở dữ liệu qua UserRepository
    const createdUser = await this.userRepository.create({
      username: cleanUsername,
      passwordHash,
      fullName: fullName.trim(),
      email: email ? email.trim() : null,
      phone: phone ? phone.trim() : null,
      roleCode: targetRoleCode,
      roleId,
      isActive: true
    });

    if (!createdUser) {
      throw new Error('Không thể tạo tài khoản nhân sự mới trong cơ sở dữ liệu.');
    }

    // 7. Ghi nhận vết kiểm toán bất biến (Rule 11 SSOT)
    if (this.auditLogRepository) {
      try {
        await this.auditLogRepository.log({
          userId: performedBy ? performedBy.id : null,
          userName: performedBy ? (performedBy.fullName || performedBy.username) : 'Quản trị viên (Admin)',
          action: 'CREATE_USER',
          entityName: 'users',
          entityId: String(createdUser.id),
          description: `[Admin] Thêm mới tài khoản nhân sự: [${createdUser.username}] (${createdUser.fullName}) - Vai trò: [${createdUser.roleCode}]`,
          ipAddress
        });
      } catch (auditErr) {
        console.warn('Ghi nhận AuditLog CREATE_USER thất bại:', auditErr.message);
      }
    }

    return createdUser.toSafeProfile();
  }
}

module.exports = CreateUserUseCase;
