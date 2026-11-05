// server.js - Supply Chain Spoilage Predictor API
// Clean Architecture 4-Tier Server with Microsoft SQL Server LocalDB

const express = require('express');
const cors = require('cors');

// Import Clean Architecture Routes
const authRoutes = require('./src/presentation/routes/authRoutes');
const userRoutes = require('./src/presentation/routes/userRoutes');
const storeProfileRoutes = require('./src/presentation/routes/storeProfileRoutes');
const catalogRoutes = require('./src/presentation/routes/catalogRoutes');
const categoryRoutes = require('./src/presentation/routes/categoryRoutes');
const batchRoutes = require('./src/presentation/routes/batchRoutes');
const salesRoutes = require('./src/presentation/routes/salesRoutes');
const spoilageRoutes = require('./src/presentation/routes/spoilageRoutes');
const forecastRoutes = require('./src/presentation/routes/forecastRoutes');
const purchaseOrderRoutes = require('./src/presentation/routes/purchaseOrderRoutes');
const dashboardRoutes = require('./src/presentation/routes/dashboardRoutes');
const shiftHandoverRoutes = require('./src/presentation/routes/shiftHandoverRoutes');
const supplierRoutes = require('./src/presentation/routes/supplierRoutes');
const stockTransferRoutes = require('./src/presentation/routes/stockTransferRoutes');

// Import DI Container
const { auditLogRepository } = require('./src/container');
const SqlConnection = require('./src/infrastructure/database/sqlConnection');

// Import Middlewares
const errorHandler = require('./src/presentation/middlewares/errorHandler');
const authMiddleware = require('./src/presentation/middlewares/authMiddleware');
const roleMiddleware = require('./src/presentation/middlewares/roleMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Global Middlewares
app.use(cors());
app.use(express.json());

// 1. Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    statusCode: 200,
    message: 'Supply Chain Spoilage Predictor API is operational (Clean Architecture)',
    database: 'Microsoft SQL Server LocalDB (retail_spoilage_db)',
    storeCode: 'RETAIL-STORE-01',
    storeName: 'LHU Mart - Co.op Smile Liên kết ĐH Lạc Hồng',
    timestamp: new Date().toISOString()
  });
});

// 2. Audit Logs Endpoint
app.get('/api/audit-logs', async (req, res, next) => {
  try {
    const limit = Number(req.query.limit || 50);
    const logs = await auditLogRepository.findRecent(limit);
    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (err) {
    next(err);
  }
});

// 2.1 Shift Handover Modules (Bàn Giao Ca Trực 4 Bước - Mục 15 SSOT)
app.use('/api/shift-handover', shiftHandoverRoutes);

// 2.2 Goods Receipts Endpoint (Mục 17.7 SSOT - Lịch sử Tiếp nhận Hàng DC)
app.get('/api/goods-receipts', async (req, res, next) => {
  try {
    const limit = Number(req.query.limit || 50);
    const sql = `
      SELECT TOP (${limit})
        gr.id,
        gr.receipt_number AS receiptNumber,
        gr.supplier_id AS supplierId,
        sup.name AS supplierName,
        gr.received_by AS receivedById,
        u.full_name AS receivedByName,
        gr.receipt_date AS receiptDate,
        gr.total_cost AS totalCost,
        gr.status,
        gr.notes,
        gr.created_at AS createdAt,
        (SELECT COUNT(*) FROM batches WHERE receipt_id = gr.id) AS batchCount
      FROM goods_receipts gr
      LEFT JOIN suppliers sup ON gr.supplier_id = sup.id
      LEFT JOIN users u ON gr.received_by = u.id
      ORDER BY gr.id DESC;
    `;
    const data = await SqlConnection.queryJson(sql);
    res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (err) {
    next(err);
  }
});

// 3. Mount Clean Architecture Modules
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/store-profile', storeProfileRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/spoilage', spoilageRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/stock-transfers', stockTransferRoutes);
app.use('/api/ai', stockTransferRoutes);

// 4. Aliases for Backward Compatibility with existing frontend
app.use('/api/products', catalogRoutes);
app.use('/api/disposals', spoilageRoutes);

// 5. Centralized Error Handling Middleware
app.use(errorHandler);

// Start HTTP Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[SERVER] API running on http://localhost:${PORT}`);
    console.log(`[DATABASE] Microsoft SQL Server LocalDB (retail_spoilage_db)`);
    console.log(`[ROUTING] Clean Architecture endpoints ready:`);
    console.log(`  - POST /api/auth/login`);
    console.log(`  - GET  /api/store-profile`);
    console.log(`  - GET  /api/catalog/products`);
    console.log(`  - GET  /api/suppliers`);
    console.log(`  - GET  /api/batches (vw_Batches_ShelfLife_Alerts)`);
    console.log(`  - POST /api/batches/receive-inbound (RSL >= 70%)`);
    console.log(`  - PATCH /api/batches/:id/discount (Quick Markdown 15%-50%)`);
    console.log(`  - PATCH /api/batches/:id/rotate (FEFO SOP Đảo kệ)`);
    console.log(`  - POST /api/sales (FEFO Split Order Deduct)`);
    console.log(`  - POST /api/spoilage (Disposal & Sổ Hao hụt)`);
    console.log(`  - GET  /api/forecast/rop (Weather & Holiday Factors)`);
    console.log(`  - POST /api/forecast/purchase-orders (PO gửi DC)`);
    console.log(`  - GET  /api/dashboard/overview (6 KPI & Action Board)`);
  });
}

module.exports = app;
