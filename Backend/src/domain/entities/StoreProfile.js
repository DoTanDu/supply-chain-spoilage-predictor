// src/domain/entities/StoreProfile.js
class StoreProfile {
  constructor({
    id,
    storeCode,
    storeName,
    address,
    phone,
    managerId,
    managerName,
    defaultDcSupplierId,
    defaultDcSupplierName,
    defaultLeadTimeDays = 1,
    minInboundRslPercent = 70.0,
    defaultWarningDays = 7,
    criticalWarningDays = 3,
    openTime = '06:00',
    closeTime = '22:00',
    shelfCapacitySkus = 1500,
    shelfCapacityUnits = 5000,
    status = 'OPEN',
    availableManagers = [],
    updatedAt
  }) {
    this.id = id;
    this.storeCode = storeCode || 'RETAIL-STORE-01';
    this.storeName = storeName;
    this.address = address;
    this.phone = phone;
    this.managerId = managerId ? Number(managerId) : 4;
    this.managerName = managerName;
    this.defaultDcSupplierId = defaultDcSupplierId;
    this.defaultDcSupplierName = defaultDcSupplierName;
    this.defaultLeadTimeDays = Number(defaultLeadTimeDays) || 1;
    this.minInboundRslPercent = Number(minInboundRslPercent) || 70.0;
    this.defaultWarningDays = Number(defaultWarningDays) || 7;
    this.criticalWarningDays = Number(criticalWarningDays) || 3;
    this.openTime = openTime || '06:00';
    this.closeTime = closeTime || '22:00';
    this.shelfCapacitySkus = Number(shelfCapacitySkus) || 1500;
    this.shelfCapacityUnits = Number(shelfCapacityUnits) || 5000;
    this.status = status; // 'OPEN', 'CLOSED', 'INVENTORY', 'SUSPENDED'
    this.availableManagers = Array.isArray(availableManagers) ? availableManagers : [];
    this.updatedAt = updatedAt || new Date();
  }

  isOpenForSales() {
    return this.status === 'OPEN';
  }

  isInventoryCheckInProgress() {
    return this.status === 'INVENTORY';
  }

  calculateShelfUtilization(currentUnits) {
    const units = Math.max(0, Number(currentUnits) || 0);
    const capacity = Math.max(1, this.shelfCapacityUnits);
    const percent = (units / capacity) * 100;
    return {
      currentUnits: units,
      capacityUnits: capacity,
      utilizationPercent: Number(percent.toFixed(1)),
      isOverCapacity: units > capacity
    };
  }

  validateInboundRsl(expiryDate, manufactureDate, importDate = new Date()) {
    const totalLife = Math.max(1, (new Date(expiryDate) - new Date(manufactureDate)) / (1000 * 3600 * 24));
    const remainingLife = (new Date(expiryDate) - new Date(importDate)) / (1000 * 3600 * 24);
    const rslPercent = (remainingLife / totalLife) * 100;
    return {
      rslPercent: Number(rslPercent.toFixed(1)),
      isAcceptable: rslPercent >= this.minInboundRslPercent
    };
  }
}

module.exports = StoreProfile;
