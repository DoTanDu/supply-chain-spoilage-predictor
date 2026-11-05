// src/application/use-cases/auth/GetCurrentUserUseCase.js
const AuthDTO = require('../../dtos/AuthDTO');

class GetCurrentUserUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Không tìm thấy thông tin người dùng.');
    }
    return AuthDTO.toResponse(user, null).user;
  }
}

module.exports = GetCurrentUserUseCase;
