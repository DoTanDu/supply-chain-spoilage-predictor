// src/application/dtos/StoreProfileDTO.js
class StoreProfileDTO {
  static toResponse(profile) {
    if (!profile) return null;
    return {
      id: profile.id,
      storeCode: profile.storeCode || 'RETAIL-STORE-01',
      storeName: profile.storeName,
      address: profile.address,
      phone: profile.phone,
      managerId: profile.managerId,
      managerName: profile.managerName || null,
      defaultDcSupplierId: profile.defaultDcSupplierId,
      defaultDcSupplierName: profile.defaultDcSupplierName || null,
      defaultLeadTimeDays: profile.defaultLeadTimeDays,
      minInboundRslPercent: profile.minInboundRslPercent,
      defaultWarningDays: profile.defaultWarningDays,
      criticalWarningDays: profile.criticalWarningDays,
      openTime: profile.openTime || '06:00',
      closeTime: profile.closeTime || '22:00',
      shelfCapacitySkus: profile.shelfCapacitySkus || 1500,
      shelfCapacityUnits: profile.shelfCapacityUnits || 5000,
      status: profile.status,
      isOpen: profile.isOpenForSales(),
      chainStoreCount: Number(profile.chainStoreCount || 1),
      isSingleStore: Number(profile.chainStoreCount || 1) <= 1,
      availableManagers: profile.availableManagers || [],
      updatedAt: profile.updatedAt
    };
  }
}

module.exports = StoreProfileDTO;
