// src/presentation/controllers/ForecastController.js
class ForecastController {
  constructor({
    calculateROPForecastUseCase,
    createPurchaseOrderUseCase,
    updatePurchaseOrderStatusUseCase,
    purchaseOrderRepository
  }) {
    this.calculateROPForecastUseCase = calculateROPForecastUseCase;
    this.createPurchaseOrderUseCase = createPurchaseOrderUseCase;
    this.updatePurchaseOrderStatusUseCase = updatePurchaseOrderStatusUseCase;
    this.purchaseOrderRepository = purchaseOrderRepository;
  }

  async getROPForecast(req, res, next) {
    try {
      const { weather = 'NORMAL', isHoliday = 'false' } = req.query;
      const result = await this.calculateROPForecastUseCase.execute({
        weather,
        isHoliday: isHoliday === 'true' || isHoliday === true
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async createPO(req, res, next) {
    try {
      const { supplierId = 1, items, expectedDeliveryDate, notes } = req.body;
      const createdBy = req.user ? req.user.id : (req.body.createdBy || 2);
      const createdByName = req.user ? req.user.fullName : (req.body.createdByName || 'Cửa hàng trưởng');

      const result = await this.createPurchaseOrderUseCase.execute({
        supplierId,
        createdBy,
        createdByName,
        items,
        expectedDeliveryDate,
        notes
      });

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async updatePOStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const approvedBy = req.user ? req.user.id : (req.body.approvedBy || 2);
      const approvedByName = req.user ? req.user.fullName : (req.body.approvedByName || 'Cửa hàng trưởng');

      const result = await this.updatePurchaseOrderStatusUseCase.execute({
        orderId: id,
        status: status || req.body.newStatus,
        newStatus: status || req.body.newStatus,
        approvedBy,
        managerId: approvedBy,
        approvedByName,
        managerName: approvedByName,
        notes
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getAllPO(req, res, next) {
    try {
      const orders = await this.purchaseOrderRepository.findAll();
      res.json({
        success: true,
        count: orders.length,
        data: orders
      });
    } catch (err) {
      next(err);
    }
  }

  async getPOById(req, res, next) {
    try {
      const { id } = req.params;
      const order = await this.purchaseOrderRepository.findById(id);
      if (!order) {
        return res.status(404).json({ success: false, message: `Không tìm thấy đơn đặt hàng ID [${id}]!` });
      }
      res.json({
        success: true,
        data: order
      });
    } catch (err) {
      next(err);
    }
  }

  async sendPOToDC(req, res, next) {
    try {
      const { id } = req.params;
      const approvedBy = req.user ? req.user.id : 2;
      const approvedByName = req.user ? (req.user.fullName || req.user.username) : 'Cửa hàng trưởng';

      const result = await this.updatePurchaseOrderStatusUseCase.execute({
        orderId: id,
        status: 'SUBMITTED',
        newStatus: 'SUBMITTED',
        approvedBy,
        managerId: approvedBy,
        approvedByName,
        managerName: approvedByName,
        notes: req.body?.notes || 'Đã xuất gửi xe tải DC Biên Hòa theo Mục 22.8 SSOT'
      });

      res.json({
        success: true,
        message: `Đã gửi đơn đặt hàng [PO #${id}] đến Trung tâm Phân phối DC Biên Hòa!`,
        data: result.data || result
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ForecastController;
