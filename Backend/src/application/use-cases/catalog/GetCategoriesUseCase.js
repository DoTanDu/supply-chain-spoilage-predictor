// src/application/use-cases/catalog/GetCategoriesUseCase.js
class GetCategoriesUseCase {
  constructor(categoryRepository) {
    this.categoryRepository = categoryRepository;
  }

  async execute() {
    const list = await this.categoryRepository.findAll();
    return list.map(item => ({
      id: item.entity.id,
      code: item.entity.code,
      name: item.entity.name,
      storageTemperature: item.entity.storageTemperature,
      defaultWarningDays: item.entity.defaultWarningDays,
      description: item.entity.description,
      productCount: item.productCount
    }));
  }
}

module.exports = GetCategoriesUseCase;
