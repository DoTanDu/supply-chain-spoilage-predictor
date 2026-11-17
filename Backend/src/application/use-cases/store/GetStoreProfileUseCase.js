// src/application/use-cases/store/GetStoreProfileUseCase.js
const StoreProfileDTO = require('../../dtos/StoreProfileDTO');

class GetStoreProfileUseCase {
  constructor(storeProfileRepository) {
    this.storeProfileRepository = storeProfileRepository;
  }

  async execute(storeId = 1) {
    const profile = await this.storeProfileRepository.getProfile(storeId);
    return StoreProfileDTO.toResponse(profile);
  }
}

module.exports = GetStoreProfileUseCase;
