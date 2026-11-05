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
      managerName: profile.managerName || 'Đỗ Tấn Du (Cửa Hàng Trưởng)',
      defaultDcSupplierId: profile.defaultDcSupplierId,
      defaultDcSupplierName: profile.defaultDcSupplierName || 'Kho Phân Phối DC Biên Hòa',
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
      availableManagers: profile.availableManagers || [],
      updatedAt: profile.updatedAt
    };
  }
}

module.exports = StoreProfileDTO;
