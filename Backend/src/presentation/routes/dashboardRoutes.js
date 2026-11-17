// src/presentation/routes/dashboardRoutes.js
const express = require('express');
const { dashboardController } = require('../../container');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = express.Router();
const dashboardGuard = roleMiddleware(['ADMIN', 'STORE_MANAGER'], {
  pageKey: 'dashboard',
  grantUnlocksRole: true
});
const reportsGuard = roleMiddleware(['ADMIN', 'STORE_MANAGER'], {
  pageKey: 'reports-analytics',
  grantUnlocksRole: true
});

// GET /api/dashboard/overview - Tổng quan điều hành
router.get('/overview', dashboardGuard, (req, res, next) => dashboardController.getOverview(req, res, next));
router.get('/stats', dashboardGuard, (req, res, next) => dashboardController.getOverview(req, res, next));
router.get('/shelf-life-stats', dashboardGuard, (req, res, next) => dashboardController.getShelfLifeStats(req, res, next));
router.get('/spoilage-rate', dashboardGuard, (req, res, next) => dashboardController.getSpoilageRate(req, res, next));
router.get('/today-action-board', dashboardGuard, (req, res, next) => dashboardController.getTodayActionBoard(req, res, next));
router.get('/reports', reportsGuard, (req, res, next) => dashboardController.getReportsAnalytics(req, res, next));
router.get('/', dashboardGuard, (req, res, next) => dashboardController.getOverview(req, res, next));

module.exports = router;
