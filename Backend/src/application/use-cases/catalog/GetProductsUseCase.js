// src/application/use-cases/catalog/GetProductsUseCase.js
const ProductDTO = require('../../dtos/ProductDTO');

class GetProductsUseCase {
  constructor(productRepository) {
    this.productRepository = productRepository;
  }

  async execute() {
    const list = await this.productRepository.findAll();
    return list.map(item => ProductDTO.toResponse(item.entity, item.totalStock));
  }
}

module.exports = GetProductsUseCase;
