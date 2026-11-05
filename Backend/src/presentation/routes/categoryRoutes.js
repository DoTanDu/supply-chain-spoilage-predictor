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

// GET /api/categories
router.get('/', CatalogController.getCategories);

// POST /api/categories
router.post('/', authMiddleware, roleMiddleware(['ADMIN', 'STORE_MANAGER']), CatalogController.createCategory);

// PUT /api/categories/:id
router.put('/:id', authMiddleware, roleMiddleware(['ADMIN', 'STORE_MANAGER']), CatalogController.updateCategory);

// DELETE /api/categories/:id
router.delete('/:id', authMiddleware, roleMiddleware(['ADMIN', 'STORE_MANAGER']), CatalogController.deleteCategory);

module.exports = router;

