// src/presentation/controllers/AuthController.js
const SqlUserRepository = require('../../infrastructure/database/repositories/SqlUserRepository');
const SqlAuditLogRepository = require('../../infrastructure/database/repositories/SqlAuditLogRepository');
const LoginUseCase = require('../../application/use-cases/auth/LoginUseCase');
const GetCurrentUserUseCase = require('../../application/use-cases/auth/GetCurrentUserUseCase');
const ChangePasswordUseCase = require('../../application/use-cases/auth/ChangePasswordUseCase');
const CreateUserUseCase = require('../../application/use-cases/auth/CreateUserUseCase');
const ResetPasswordUseCase = require('../../application/use-cases/auth/ResetPasswordUseCase');
const UpdateUserUseCase = require('../../application/use-cases/auth/UpdateUserUseCase');

const userRepo = new SqlUserRepository();
const auditRepo = new SqlAuditLogRepository();
const loginUseCase = new LoginUseCase(userRepo, auditRepo);
const getCurrentUserUseCase = new GetCurrentUserUseCase(userRepo);
const changePasswordUseCase = new ChangePasswordUseCase(userRepo, auditRepo);
const createUserUseCase = new CreateUserUseCase(userRepo, auditRepo);
const resetPasswordUseCase = new ResetPasswordUseCase(userRepo, auditRepo);
const updateUserUseCase = new UpdateUserUseCase(userRepo, auditRepo);

class AuthController {
  static async login(req, res, next) {
    try {
      const { username, password } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const result = await loginUseCase.execute({ username, password, ipAddress });
      res.json({
        success: true,
        message: 'Đăng nhập thành công.',
        data: result
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  }

  static async getMe(req, res, next) {
    try {
      const user = await getCurrentUserUseCase.execute(req.user.id);
      res.json({
        success: true,
        data: user
      });
    } catch (err) {
      next(err);
    }
  }

  static async getUsers(req, res, next) {
    try {
      const users = await userRepo.findAll();
      res.json({
        success: true,
        data: users.map(u => u.toSafeProfile())
      });
    } catch (err) {
      next(err);
    }
  }

  static async toggleUserStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const targetId = Number(id);

      const targetUser = await userRepo.findById(targetId);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng.'
        });
      }

      // Ngăn chặn admin tự khóa tài khoản của chính mình
      if (req.user && req.user.id === targetId && !isActive) {
        return res.status(400).json({
          success: false,
          message: 'Quản trị viên không thể tự khóa tài khoản của chính mình.'
        });
      }

      const updated = await userRepo.updateStatus(targetId, isActive);

      // Nếu mở khóa tài khoản, reset ngay bộ đếm số lần nhập sai mật khẩu
      if (isActive) {
        LoginUseCase.resetFailedAttempts(targetUser.username);
      }

      // Ghi vết kiểm toán bất biến (Rule 11 SSOT)
      if (auditRepo) {
        try {
          const ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';
          const actionText = isActive ? 'MỞ KHÓA' : 'KHÓA';
          await auditRepo.log({
            userId: req.user ? req.user.id : null,
            userName: req.user ? (req.user.fullName || req.user.username) : 'Quản trị viên',
            action: isActive ? 'UNLOCK_USER' : 'LOCK_USER',
            entityName: 'users',
            entityId: String(targetId),
            description: `[Admin] ${actionText} tài khoản người dùng: [${targetUser.username}] (${targetUser.fullName}) - Vai trò: ${targetUser.roleCode}`,
            ipAddress
          });
        } catch (auditErr) {
          console.warn('Ghi nhận AuditLog thất bại:', auditErr.message);
        }
      }

      res.json({
        success: true,
        message: `Đã ${isActive ? 'mở khóa' : 'khóa'} tài khoản "${targetUser.fullName}" thành công.`,
        data: updated ? updated.toSafeProfile() : null
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  }

  static async changePassword(req, res, next) {
    try {
      const { oldPassword, newPassword, confirmPassword } = req.body;
      const userId = req.user.id;
      const ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await changePasswordUseCase.execute({
        userId,
        oldPassword,
        newPassword,
        confirmPassword,
        ipAddress
      });

      res.json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  }

  static async createUser(req, res, next) {
    try {
      const { username, password, fullName, email, phone, roleCode, roleId } = req.body;
      const performedBy = req.user;
      const ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const newUser = await createUserUseCase.execute({
        username,
        password,
        fullName,
        email,
        phone,
        roleCode,
        roleId,
        performedBy,
        ipAddress
      });

      res.status(201).json({
        success: true,
        message: `Đã tạo tài khoản "${newUser.fullName}" (@${newUser.username}) với vai trò [${newUser.roleCode}] thành công.`,
        data: newUser
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  }

  static async resetPassword(req, res, next) {
    try {
      const { id } = req.params;
      const { newPassword, confirmPassword } = req.body;
      const performedBy = req.user;
      const ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await resetPasswordUseCase.execute({
        targetUserId: id,
        newPassword,
        confirmPassword,
        performedBy,
        ipAddress
      });

      // Reset bộ đếm số lần sai khi Admin reset mật khẩu cho nhân viên
      if (result.data && result.data.username) {
        LoginUseCase.resetFailedAttempts(result.data.username);
      }

      res.json(result);
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  }

  static async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { fullName, email, phone, roleCode, roleId } = req.body;
      const performedBy = req.user;
      const ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await updateUserUseCase.execute({
        targetUserId: id,
        fullName,
        email,
        phone,
        roleCode,
        roleId,
        performedBy,
        ipAddress
      });

      res.json(result);
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  }

  static async logout(req, res, next) {
    try {
      if (req.user && auditRepo) {
        const ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';
        try {
          await auditRepo.log({
            userId: req.user.id,
            userName: req.user.fullName || req.user.username,
            action: 'LOGOUT',
            entityName: 'users',
            entityId: String(req.user.id),
            description: `[Đăng xuất] Người dùng "${req.user.fullName || req.user.username}" (@${req.user.username}) đã đăng xuất khỏi hệ thống.`,
            ipAddress
          });
        } catch (e) {
          console.warn('Ghi log logout thất bại:', e.message);
        }
      }
      res.json({
        success: true,
        message: 'Đăng xuất khỏi hệ thống thành công.'
      });
    } catch (err) {
      next(err);
    }
  }

  static async getUserById(req, res, next) {
    try {
      const targetId = Number(req.params.id);
      const user = await userRepo.findById(targetId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy người dùng ID [${targetId}].`
        });
      }
      res.json({
        success: true,
        data: user.toSafeProfile()
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteUser(req, res, next) {
    try {
      const targetId = Number(req.params.id);
      const targetUser = await userRepo.findById(targetId);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy người dùng ID [${targetId}].`
        });
      }

      if (req.user && req.user.id === targetId) {
        return res.status(400).json({
          success: false,
          message: 'Quản trị viên không thể tự xóa tài khoản của chính mình.'
        });
      }

      await userRepo.updateStatus(targetId, false);

      if (auditRepo) {
        const ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';
        try {
          await auditRepo.log({
            userId: req.user ? req.user.id : null,
            userName: req.user ? (req.user.fullName || req.user.username) : 'Quản trị viên',
            action: 'DELETE_USER',
            entityName: 'users',
            entityId: String(targetId),
            description: `[Admin] Vô hiệu hóa tài khoản người dùng: [${targetUser.username}] (${targetUser.fullName})`,
            ipAddress
          });
        } catch (e) {
          console.warn('Ghi log deleteUser thất bại:', e.message);
        }
      }

      res.json({
        success: true,
        message: `Đã vô hiệu hóa tài khoản "${targetUser.fullName}" thành công.`
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AuthController;
