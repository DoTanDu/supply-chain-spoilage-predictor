// src/presentation/routes/dashboardRoutes.js
const express = require('express');
const { dashboardController } = require('../../container');

const router = express.Router();

// GET /api/dashboard/overview - 6 Thẻ KPI tài chính điều hành + Action Board ca trực khẩn cấp
router.get('/overview', (req, res, next) => dashboardController.getOverview(req, res, next));
router.get('/stats', (req, res, next) => dashboardController.getOverview(req, res, next));
router.get('/shelf-life-stats', (req, res, next) => dashboardController.getShelfLifeStats(req, res, next));
router.get('/spoilage-rate', (req, res, next) => dashboardController.getSpoilageRate(req, res, next));
router.get('/today-action-board', (req, res, next) => dashboardController.getTodayActionBoard(req, res, next));
router.get('/', (req, res, next) => dashboardController.getOverview(req, res, next));

module.exports = router;
