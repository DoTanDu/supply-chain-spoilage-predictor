// src/presentation/routes/categoryRoutes.js
/**
 * Router: Quản lý Danh mục Ngành hàng FMCG theo Mục 22.4 Đặc tả SSOT
 * GET /api/categories
 * POST /api/categories
 * PUT /api/categories/:id
 * DELETE /api/categories/:id
 */
const express = require('express');
const CatalogController = require('../controllers/CatalogController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = express.Router();
const catalogManageGuard = roleMiddleware(['ADMIN', 'STORE_MANAGER'], { pageKey: 'inventory-management' });

// GET /api/categories
router.get('/', CatalogController.getCategories);

// POST /api/categories
router.post('/', authMiddleware, catalogManageGuard, CatalogController.createCategory);

// PUT /api/categories/:id
router.put('/:id', authMiddleware, catalogManageGuard, CatalogController.updateCategory);

// DELETE /api/categories/:id
router.delete('/:id', authMiddleware, catalogManageGuard, CatalogController.deleteCategory);

module.exports = router;

