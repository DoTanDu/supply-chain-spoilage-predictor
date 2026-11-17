// src/presentation/controllers/DashboardController.js
const { resolveStoreScope } = require('../middlewares/storeScope');

class DashboardController {
  constructor({ getDashboardOverviewUseCase, getReportsAnalyticsUseCase }) {
    this.getDashboardOverviewUseCase = getDashboardOverviewUseCase;
    this.getReportsAnalyticsUseCase = getReportsAnalyticsUseCase;
  }

  // Danh tính chỉ lấy từ phiên đã xác thực (authMiddleware). Không tin tham số client (?role=) và không mặc định quyền OWNER.
  _extractContext(req) {
    if (req.user) {
      return { roleCode: req.user.roleCode, userStoreId: req.user.storeId };
    }
    return { roleCode: null, userStoreId: null };
  }

  _resolveScope(req, res) {
    const scope = resolveStoreScope(req, req.query?.storeId, { adminDefault: 'ALL' });
    if (!scope.ok) {
      res.status(scope.statusCode).json(scope.error);
      return null;
    }
    return scope;
  }

  async getOverview(req, res, next) {
    try {
      const scope = this._resolveScope(req, res);
      if (!scope) return;

      const { roleCode } = this._extractContext(req);
      const result = await this.getDashboardOverviewUseCase.execute({ roleCode, storeId: scope.storeId });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getShelfLifeStats(req, res, next) {
    try {
      const scope = this._resolveScope(req, res);
      if (!scope) return;

      const { roleCode } = this._extractContext(req);
      const result = await this.getDashboardOverviewUseCase.execute({ roleCode, storeId: scope.storeId });
      res.json({
        success: true,
        data: result.shelfLifeDistribution
      });
    } catch (err) {
      next(err);
    }
  }

  async getSpoilageRate(req, res, next) {
    try {
      const scope = this._resolveScope(req, res);
      if (!scope) return;

      const { roleCode } = this._extractContext(req);
      const result = await this.getDashboardOverviewUseCase.execute({ roleCode, storeId: scope.storeId });
      res.json({
        success: true,
        data: {
          spoilageRatePercent: result.kpiMetrics.spoilageRatePercent,
          totalInventoryCost: result.kpiMetrics.totalInventoryCost,
          atRiskCost: result.kpiMetrics.atRiskCost
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async getTodayActionBoard(req, res, next) {
    try {
      const scope = this._resolveScope(req, res);
      if (!scope) return;

      const { roleCode } = this._extractContext(req);
      const result = await this.getDashboardOverviewUseCase.execute({ roleCode, storeId: scope.storeId });
      res.json({
        success: true,
        data: result.actionBoard
      });
    } catch (err) {
      next(err);
    }
  }

  async getReportsAnalytics(req, res, next) {
    try {
      const scope = this._resolveScope(req, res);
      if (!scope) return;

      const days = Number(req.query?.days || 14);
      const result = await this.getReportsAnalyticsUseCase.execute({
        storeId: scope.storeId,
        days
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = DashboardController;
