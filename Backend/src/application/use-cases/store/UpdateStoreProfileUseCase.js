// src/application/use-cases/store/UpdateStoreProfileUseCase.js
const StoreProfileDTO = require('../../dtos/StoreProfileDTO');

class UpdateStoreProfileUseCase {
  constructor(storeProfileRepository, auditLogRepository) {
    this.storeProfileRepository = storeProfileRepository;
    this.auditLogRepository = auditLogRepository;
  }

  async execute(updateData, currentUser, ipAddress) {
    const validStatuses = ['OPEN', 'CLOSED', 'INVENTORY', 'SUSPENDED'];
    if (updateData.status && !validStatuses.includes(updateData.status)) {
      throw new Error(`Trạng thái cửa hàng không hợp lệ. Chỉ chấp nhận: ${validStatuses.join(', ')}`);
    }

    const targetId = updateData.id ? Number(updateData.id) : 1;
    const current = await this.storeProfileRepository.getProfile(targetId);
    const roleCode = currentUser?.roleCode || 'GUEST';

    // Ranh giới Phân quyền (SoD - Mục 4.1, 4.2 & Mục 5 SSOT):
    // STORE_MANAGER chỉ được phép chuyển đổi Trạng thái hoạt động cửa hàng (status) và khung giờ ca trực,
    // không được phép tự ý thay đổi các ngưỡng kỹ thuật lõi (Min RSL, Cảnh báo 3 màu, Lead Time, Cửa hàng trưởng).
    if (roleCode === 'STORE_MANAGER' && current) {
      const triedChangeRsl = updateData.minInboundRslPercent !== undefined && Number(updateData.minInboundRslPercent) !== Number(current.minInboundRslPercent);
      const triedChangeWarn = updateData.defaultWarningDays !== undefined && Number(updateData.defaultWarningDays) !== Number(current.defaultWarningDays);
      const triedChangeCrit = updateData.criticalWarningDays !== undefined && Number(updateData.criticalWarningDays) !== Number(current.criticalWarningDays);
      const triedChangeLead = updateData.defaultLeadTimeDays !== undefined && Number(updateData.defaultLeadTimeDays) !== Number(current.defaultLeadTimeDays);
      const triedChangeManager = updateData.managerId !== undefined && Number(updateData.managerId) !== Number(current.managerId);
      const triedChangeSkus = updateData.shelfCapacitySkus !== undefined && Number(updateData.shelfCapacitySkus) !== Number(current.shelfCapacitySkus);
      const triedChangeUnits = updateData.shelfCapacityUnits !== undefined && Number(updateData.shelfCapacityUnits) !== Number(current.shelfCapacityUnits);

      if (triedChangeRsl || triedChangeWarn || triedChangeCrit || triedChangeLead || triedChangeManager || triedChangeSkus || triedChangeUnits) {
        throw new Error(
          'Vi phạm Ranh giới Phân quyền (SoD - Mục 4.2 & Mục 5): Cửa hàng trưởng chỉ được phép chuyển đổi Trạng thái hoạt động cửa hàng (OPEN/CLOSED/INVENTORY/SUSPENDED) và giờ đóng/mở ca. Quyền thay đổi ngưỡng Min RSL, Cảnh báo 3 màu, Lead Time, Sức chứa quầy kệ và bổ nhiệm Cửa hàng trưởng thuộc về Quản trị viên hệ thống (ADMIN).'
        );
      }

      // Khóa cứng payload của STORE_MANAGER chỉ cập nhật status và giờ hoạt động
      updateData = {
        status: updateData.status !== undefined ? updateData.status : current.status,
        openTime: updateData.openTime !== undefined ? updateData.openTime : current.openTime,
        closeTime: updateData.closeTime !== undefined ? updateData.closeTime : current.closeTime
      };
    }

    // 1. Kiểm tra Min RSL từ DC (Rule 7 SSOT: chuẩn 70%, cho phép dải 50% - 95%)
    if (updateData.minInboundRslPercent !== undefined) {
      const rsl = Number(updateData.minInboundRslPercent);
      if (isNaN(rsl) || rsl < 50 || rsl > 95) {
        throw new Error('Ngưỡng nhận date từ DC (Min RSL) phải nằm trong khoảng từ 50% đến 95%.');
      }
    }

    // 2. Kiểm tra Ngưỡng Đỏ (Critical Days - Rule 4 SSOT: 1 đến 5 ngày)
    if (updateData.criticalWarningDays !== undefined) {
      const crit = Number(updateData.criticalWarningDays);
      if (isNaN(crit) || crit < 1 || crit > 5) {
        throw new Error('Ngưỡng cảnh báo Vùng Đỏ (nguy kịch) phải từ 1 đến 5 ngày.');
      }
    }

    // 3. Kiểm tra Ngưỡng Vàng (Warning Days - Rule 4 SSOT: 3 đến 30 ngày)
    if (updateData.defaultWarningDays !== undefined) {
      const warn = Number(updateData.defaultWarningDays);
      if (isNaN(warn) || warn < 3 || warn > 30) {
        throw new Error('Ngưỡng cảnh báo Vùng Vàng (cảnh báo) phải từ 3 đến 30 ngày.');
      }
    }

    // 4. Kiểm tra Lead Time DC (Rule 8 SSOT: 1 đến 14 ngày)
    if (updateData.defaultLeadTimeDays !== undefined) {
      const lt = Number(updateData.defaultLeadTimeDays);
      if (isNaN(lt) || lt < 1 || lt > 14) {
        throw new Error('Thời gian giao hàng (Lead Time DC) phải từ 1 đến 14 ngày.');
      }
    }

    // 5. Kiểm tra định dạng Giờ mở cửa / Giờ đóng cửa (HH:mm)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (updateData.openTime !== undefined && !timeRegex.test(String(updateData.openTime).trim())) {
      throw new Error('Giờ mở cửa không hợp lệ (định dạng chuẩn HH:mm, ví dụ 06:00).');
    }
    if (updateData.closeTime !== undefined && !timeRegex.test(String(updateData.closeTime).trim())) {
      throw new Error('Giờ đóng cửa không hợp lệ (định dạng chuẩn HH:mm, ví dụ 22:00).');
    }

    // 6. Ràng buộc quan hệ: Ngưỡng Đỏ < Ngưỡng Vàng
    const finalCrit = updateData.criticalWarningDays !== undefined ? Number(updateData.criticalWarningDays) : current?.criticalWarningDays;
    const finalWarn = updateData.defaultWarningDays !== undefined ? Number(updateData.defaultWarningDays) : current?.defaultWarningDays;
    if (finalCrit !== undefined && finalWarn !== undefined && finalCrit >= finalWarn) {
      throw new Error(`Ngưỡng cảnh báo Vùng Đỏ (${finalCrit} ngày) bắt buộc phải nhỏ hơn ngưỡng Vùng Vàng (${finalWarn} ngày).`);
    }

    // 7. Kiểm tra Sức chứa quầy kệ SKU (Mục 3.1 & Mục 5 SSOT: 100 đến 10,000 SKU)
    if (updateData.shelfCapacitySkus !== undefined) {
      const skus = Number(updateData.shelfCapacitySkus);
      if (isNaN(skus) || skus < 100 || skus > 10000) {
        throw new Error('Sức chứa quầy kệ (SKU) phải từ 100 đến 10.000 SKU.');
      }
    }

    // 8. Kiểm tra Sức chứa đơn vị sản phẩm (Units) (Mục 3.1 & Mục 5 SSOT: 500 đến 50,000 đơn vị)
    if (updateData.shelfCapacityUnits !== undefined) {
      const units = Number(updateData.shelfCapacityUnits);
      if (isNaN(units) || units < 500 || units > 50000) {
        throw new Error('Sức chứa quầy kệ (đơn vị sản phẩm) phải từ 500 đến 50.000 đơn vị.');
      }
    }

    const updated = await this.storeProfileRepository.updateProfile(updateData);

    if (this.auditLogRepository && currentUser) {
      try {
        await this.auditLogRepository.log({
          userId: currentUser.id,
          userName: currentUser.fullName || currentUser.username,
          action: 'UPDATE_STORE_PROFILE',
          entityName: 'StoreProfile',
          entityId: String(updated.id),
          description: `[${currentUser.roleCode}] Cập nhật hồ sơ cửa hàng [${updated.storeCode} - ${updated.storeName}]: Cửa hàng trưởng: ${updated.managerName} (#${updated.managerId}) | Giờ mở cửa: ${updated.openTime} - ${updated.closeTime} | Sức chứa: ${updated.shelfCapacitySkus} SKU / ${updated.shelfCapacityUnits} units | Min RSL: ${updated.minInboundRslPercent}% | Vàng: ${updated.defaultWarningDays}d | Đỏ: ${updated.criticalWarningDays}d | Lead Time: ${updated.defaultLeadTimeDays}d | Trạng thái: ${updated.status}`,
          ipAddress
        });
      } catch (auditErr) {
        console.warn('Ghi nhận AuditLog UPDATE_STORE_PROFILE thất bại:', auditErr.message);
      }
    }

    return StoreProfileDTO.toResponse(updated);
  }
}

module.exports = UpdateStoreProfileUseCase;
