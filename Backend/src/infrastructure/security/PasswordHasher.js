// src/infrastructure/security/PasswordHasher.js
const bcrypt = require('bcryptjs');

class PasswordHasher {
  static async hash(plainPassword) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(plainPassword, salt);
  }

  static async compare(plainPassword, hashedPassword) {
    if (!plainPassword || !hashedPassword) return false;
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = PasswordHasher;
