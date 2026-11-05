// src/domain/entities/Category.js
class Category {
  constructor({ id, code, name, storageTemperature, defaultWarningDays = 7, description, createdAt }) {
    this.id = id;
    this.code = code;
    this.name = name;
    this.storageTemperature = storageTemperature || 'Nhiệt độ phòng (25°C)';
    this.defaultWarningDays = Number(defaultWarningDays) || 7;
    this.description = description;
    this.createdAt = createdAt || new Date();
  }
}

module.exports = Category;
