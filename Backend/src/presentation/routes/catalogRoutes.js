// src/presentation/routes/catalogRoutes.js
const express = require('express');
const CatalogController = require('../controllers/CatalogController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = express.Router();

// Categories
router.get('/categories', CatalogController.getCategories);
router.post('/categories', authMiddleware, roleMiddleware(['ADMIN', 'STORE_MANAGER']), CatalogController.createCategory);
router.put('/categories/:id', authMiddleware, roleMiddleware(['ADMIN', 'STORE_MANAGER']), CatalogController.updateCategory);
router.delete('/categories/:id', authMiddleware, roleMiddleware(['ADMIN', 'STORE_MANAGER']), CatalogController.deleteCategory);

// Products (hỗ trợ cả GET / và GET /products)
router.get('/products', CatalogController.getProducts);
router.get('/products/:id', CatalogController.getProductById);
router.get('/:id', CatalogController.getProductById);
router.get('/', CatalogController.getProducts);

// POST /api/products (Thêm sản phẩm mới kèm chống trùng lặp, chỉ ADMIN & STORE_MANAGER)
router.post('/products', authMiddleware, roleMiddleware(['ADMIN', 'STORE_MANAGER']), CatalogController.createProduct);
router.post('/', authMiddleware, roleMiddleware(['ADMIN', 'STORE_MANAGER']), CatalogController.createProduct);

// PUT /api/products/:id (Cập nhật thông tin sản phẩm, giá vốn/giá bán, chỉ ADMIN & STORE_MANAGER)
router.put('/:id', authMiddleware, roleMiddleware(['ADMIN', 'STORE_MANAGER']), CatalogController.updateProduct);
router.put('/products/:id', authMiddleware, roleMiddleware(['ADMIN', 'STORE_MANAGER']), CatalogController.updateProduct);

// DELETE /api/products/:id (Ngừng kinh doanh sản phẩm, chỉ ADMIN & STORE_MANAGER)
router.delete('/:id', authMiddleware, roleMiddleware(['ADMIN', 'STORE_MANAGER']), CatalogController.deleteProduct);
router.delete('/products/:id', authMiddleware, roleMiddleware(['ADMIN', 'STORE_MANAGER']), CatalogController.deleteProduct);

module.exports = router;
