// src/application/use-cases/store/CreateStoreProfileUseCase.js
const StoreProfileDTO = require('../../dtos/StoreProfileDTO');

class CreateStoreProfileUseCase {
  constructor(storeProfileRepository, auditLogRepository) {
    this.storeProfileRepository = storeProfileRepository;
    this.auditLogRepository = auditLogRepository;
  }

  async execute(inputData, currentUser, ipAddress) {
    const rawRole = String(currentUser?.roleCode || 'GUEST').toUpperCase().trim();
    if (rawRole !== 'ADMIN' && rawRole !== 'OWNER') {
      const err = new Error('Chỉ Chủ chuỗi / Quản trị viên (OWNER) mới được phép mở chi nhánh mới.');
      err.statusCode = 403;
      err.code = 'ERR_UNAUTHORIZED_ROLE';
      throw err;
    }

    const storeCode = String(inputData.storeCode || '').trim().toUpperCase();
    const storeName = String(inputData.storeName || '').trim();
    const address = String(inputData.address || '').trim();
    const phone = String(inputData.phone || '').trim();
    const status = String(inputData.status || 'OPEN').trim().toUpperCase();

    if (!storeCode || !/^[A-Z0-9_-]{3,30}$/.test(storeCode)) {
      const err = new Error('Mã chi nhánh không hợp lệ (3-30 ký tự chữ hoa, số, dấu gạch ngang/dưới).');
      err.statusCode = 400;
      throw err;
    }
    if (!storeName || storeName.length < 3) {
      const err = new Error('Tên chi nhánh phải có ít nhất 3 ký tự.');
      err.statusCode = 400;
      throw err;
    }
    if (!address || address.length < 5) {
      const err = new Error('Địa chỉ chi nhánh không được để trống.');
      err.statusCode = 400;
      throw err;
    }

    const validStatuses = ['OPEN', 'CLOSED', 'INVENTORY', 'SUSPENDED'];
    if (!validStatuses.includes(status)) {
      const err = new Error(`Trạng thái cửa hàng không hợp lệ. Chỉ chấp nhận: ${validStatuses.join(', ')}.`);
      err.statusCode = 400;
      throw err;
    }

    const existing = await this.storeProfileRepository.findByCode(storeCode);
    if (existing) {
      const err = new Error(`Mã chi nhánh [${storeCode}] đã tồn tại trong hệ thống (${existing.storeName}).`);
      err.statusCode = 409;
      throw err;
    }

    const minRsl = inputData.minInboundRslPercent !== undefined ? Number(inputData.minInboundRslPercent) : 70;
    const warnDays = inputData.defaultWarningDays !== undefined ? Number(inputData.defaultWarningDays) : 7;
    const critDays = inputData.criticalWarningDays !== undefined ? Number(inputData.criticalWarningDays) : 3;
    const leadTime = inputData.defaultLeadTimeDays !== undefined ? Number(inputData.defaultLeadTimeDays) : 1;
    const shelfSkus = inputData.shelfCapacitySkus !== undefined ? Number(inputData.shelfCapacitySkus) : 1200;
    const shelfUnits = inputData.shelfCapacityUnits !== undefined ? Number(inputData.shelfCapacityUnits) : 4000;
    const openTime = String(inputData.openTime || '06:00').trim();
    const closeTime = String(inputData.closeTime || '22:00').trim();

    if (isNaN(minRsl) || minRsl < 50 || minRsl > 95) {
      const err = new Error('Ngưỡng nhận date từ DC (Min RSL) phải từ 50% đến 95%.');
      err.statusCode = 400;
      throw err;
    }
    if (isNaN(critDays) || critDays < 1 || critDays > 5) {
      const err = new Error('Ngưỡng cảnh báo Vùng Đỏ phải từ 1 đến 5 ngày.');
      err.statusCode = 400;
      throw err;
    }
    if (isNaN(warnDays) || warnDays < 3 || warnDays > 30 || critDays >= warnDays) {
      const err = new Error('Ngưỡng Vùng Vàng phải từ 3 đến 30 ngày và lớn hơn ngưỡng Vùng Đỏ.');
      err.statusCode = 400;
      throw err;
    }
    if (isNaN(leadTime) || leadTime < 1 || leadTime > 14) {
      const err = new Error('Lead Time giao hàng phải từ 1 đến 14 ngày.');
      err.statusCode = 400;
      throw err;
    }
    if (isNaN(shelfSkus) || shelfSkus < 100 || shelfSkus > 10000 || isNaN(shelfUnits) || shelfUnits < 500 || shelfUnits > 50000) {
      const err = new Error('Sức chứa kệ hàng nằm ngoài dải hợp lệ (100-10.000 SKU, 500-50.000 ĐV).');
      err.statusCode = 400;
      throw err;
    }

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(openTime) || !timeRegex.test(closeTime)) {
      const err = new Error('Giờ mở cửa / đóng cửa phải đúng định dạng HH:mm.');
      err.statusCode = 400;
      throw err;
    }

    const created = await this.storeProfileRepository.createProfile({
      storeCode,
      storeName,
      address,
      phone,
      managerId: inputData.managerId ? Number(inputData.managerId) : null,
      defaultDcSupplierId: inputData.defaultDcSupplierId ? Number(inputData.defaultDcSupplierId) : 1,
      defaultLeadTimeDays: leadTime,
      minInboundRslPercent: minRsl,
      defaultWarningDays: warnDays,
      criticalWarningDays: critDays,
      openTime,
      closeTime,
      shelfCapacitySkus: shelfSkus,
      shelfCapacityUnits: shelfUnits,
      status
    });

    if (this.auditLogRepository && currentUser) {
      try {
        await this.auditLogRepository.log({
          userId: currentUser.id,
          userName: currentUser.fullName || currentUser.username,
          action: 'CREATE_STORE_PROFILE',
          entityName: 'StoreProfile',
          entityId: String(created.id),
          description: `[${currentUser.roleCode}] Khởi tạo chi nhánh mới [${created.storeCode}] ${created.storeName} (${created.address}) | Min RSL: ${created.minInboundRslPercent}% | LeadTime: ${created.defaultLeadTimeDays}d`,
          ipAddress
        });
      } catch (auditErr) {
        console.warn('Ghi nhận AuditLog CREATE_STORE_PROFILE thất bại:', auditErr.message);
      }
    }

    return StoreProfileDTO.toResponse(created);
  }
}

module.exports = CreateStoreProfileUseCase;
