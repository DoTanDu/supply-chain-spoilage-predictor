// src/presentation/controllers/DashboardController.js
const TokenService = require('../../infrastructure/security/TokenService');

class DashboardController {
  constructor({ getDashboardOverviewUseCase }) {
    this.getDashboardOverviewUseCase = getDashboardOverviewUseCase;
  }

  _extractContext(req) {
    if (req.user) {
      return { roleCode: req.user.roleCode, userStoreId: req.user.storeId };
    }
    const authHeader = req.headers && req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = TokenService.verifyToken(token);
      if (decoded) {
        return { roleCode: decoded.roleCode, userStoreId: decoded.storeId };
      }
    }
    return {
      roleCode: (req.query && req.query.role) || null,
      userStoreId: null
    };
  }

  async getOverview(req, res, next) {
    try {
      const { roleCode, userStoreId } = this._extractContext(req);
      const requestedStoreId = req.query?.storeId;
      const isOwner = !roleCode || roleCode === 'ADMIN' || roleCode === 'OWNER';

      if (!isOwner && userStoreId && requestedStoreId && String(requestedStoreId).toUpperCase() !== 'ALL' && Number(requestedStoreId) !== Number(userStoreId)) {
        return res.status(403).json({
          success: false,
          statusCode: 403,
          code: 'ERR_STORE_SCOPE_FORBIDDEN',
          message: `Từ chối truy cập dữ liệu liên chi nhánh (403 Forbidden). Bạn thuộc Chi nhánh #${userStoreId}, không có quyền xem Dashboard của Chi nhánh #${requestedStoreId}.`
        });
      }

      const effectiveStoreId = isOwner ? (requestedStoreId || 'ALL') : (requestedStoreId || userStoreId || 1);
      const result = await this.getDashboardOverviewUseCase.execute({ roleCode, storeId: effectiveStoreId });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getShelfLifeStats(req, res, next) {
    try {
      const { roleCode } = this._extractContext(req);
      const result = await this.getDashboardOverviewUseCase.execute({ roleCode });
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
      const { roleCode } = this._extractContext(req);
      const result = await this.getDashboardOverviewUseCase.execute({ roleCode });
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
      const { roleCode } = this._extractContext(req);
      const result = await this.getDashboardOverviewUseCase.execute({ roleCode });
      res.json({
        success: true,
        data: result.actionBoard
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = DashboardController;
