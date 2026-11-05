// src/presentation/controllers/DashboardController.js
const TokenService = require('../../infrastructure/security/TokenService');

class DashboardController {
  constructor({ getDashboardOverviewUseCase }) {
    this.getDashboardOverviewUseCase = getDashboardOverviewUseCase;
  }

  _extractRole(req) {
    if (req.user && req.user.roleCode) return req.user.roleCode;
    const authHeader = req.headers && req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = TokenService.verifyToken(token);
      if (decoded && decoded.roleCode) return decoded.roleCode;
    }
    return (req.query && req.query.role) || null;
  }

  async getOverview(req, res, next) {
    try {
      const roleCode = this._extractRole(req);
      const result = await this.getDashboardOverviewUseCase.execute({ roleCode });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getShelfLifeStats(req, res, next) {
    try {
      const roleCode = this._extractRole(req);
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
      const roleCode = this._extractRole(req);
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
      const roleCode = this._extractRole(req);
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
