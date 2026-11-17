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
const supplierRoutes = require('./src/presentation/routes/supplierRoutes');
const stockTransferRoutes = require('./src/presentation/routes/stockTransferRoutes');

// Import DI Container
const { auditLogRepository } = require('./src/container');
const SqlConnection = require('./src/infrastructure/database/sqlConnection');
const ensureSmartSupplySchema = require('./src/infrastructure/database/ensureSmartSupplySchema');

// Import Middlewares
const errorHandler = require('./src/presentation/middlewares/errorHandler');
const authMiddleware = require('./src/presentation/middlewares/authMiddleware');
const roleMiddleware = require('./src/presentation/middlewares/roleMiddleware');
const { resolveStoreScope } = require('./src/presentation/middlewares/storeScope');
const { buildCorsOptions } = require('./src/presentation/middlewares/corsConfig');
const TokenService = require('./src/infrastructure/security/TokenService');

const app = express();
const PORT = process.env.PORT || 5000;

// Global Middlewares
app.use(cors(buildCorsOptions()));
app.use(express.json({ limit: '10mb' }));

// Global Optional JWT Context Hydrator (phục vụ Data Scoping theo store_id trên các GET endpoints)
app.use((req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = TokenService.verifyToken(token);
    if (decoded && decoded.userId) {
      req.user = {
        id: decoded.userId,
        username: decoded.username,
        roleCode: decoded.roleCode,
        storeId: Number(decoded.storeId || 1)
      };
    }
  }
  next();
});

// Deny-by-default: mọi route dưới /api đều yêu cầu Bearer token hợp lệ (đồng thời kiểm tra tài khoản còn hoạt động),
// trừ các route công khai liệt kê dưới đây. (OWASP API2:2023 / API5:2023)
const PUBLIC_API_ROUTES = Object.freeze([
  { method: 'GET', path: '/health' },
  { method: 'POST', path: '/auth/login' },
  { method: 'POST', path: '/auth/logout' }
]);

app.use('/api', (req, res, next) => {
  const requestPath = req.path.length > 1 ? req.path.replace(/\/+$/, '') : req.path;
  const isPublic = PUBLIC_API_ROUTES.some(
    (route) => route.method === req.method && route.path === requestPath
  );
  if (isPublic) return next();
  return authMiddleware(req, res, next);
});

// Chuẩn hóa tham số limit: số nguyên dương, có trần, tránh nội suy giá trị tùy ý vào câu lệnh SQL TOP
function parseLimit(raw, fallback = 50, max = 500) {
  const n = Number.parseInt(raw, 10);
  return Number.isInteger(n) && n > 0 ? Math.min(n, max) : fallback;
}

// 1. Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    statusCode: 200,
    message: 'SmartSupply AI API is operational (Clean Architecture)',
    database: 'Microsoft SQL Server LocalDB (retail_spoilage_db)',
    storeCode: 'RETAIL-STORE-01',
    storeName: 'SmartSupply AI Retail Chain',
    timestamp: new Date().toISOString()
  });
});

// 2. Audit Logs Endpoint (Chỉ ADMIN & STORE_MANAGER hoặc tài khoản được cấp quyền Settings & Integration)
app.get('/api/audit-logs', roleMiddleware(['ADMIN', 'STORE_MANAGER'], { pageKey: 'settings-integration', grantUnlocksRole: true }), async (req, res, next) => {
  try {
    const scope = resolveStoreScope(req, req.query?.storeId, { adminDefault: 'ALL' });
    if (!scope.ok) {
      return res.status(scope.statusCode).json(scope.error);
    }

    const limit = parseLimit(req.query.limit);
    const logs = await auditLogRepository.findRecent(limit, scope.storeId);
    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (err) {
    next(err);
  }
});

// 2.2 Goods Receipts Endpoint (Lịch sử Nhập kho theo chi nhánh)
app.get('/api/goods-receipts', roleMiddleware(['ADMIN', 'STORE_MANAGER', 'CASHIER'], { pageKey: 'inventory-management' }), async (req, res, next) => {
  try {
    const scope = resolveStoreScope(req, req.query?.storeId, { adminDefault: 'ALL' });
    if (!scope.ok) {
      return res.status(scope.statusCode).json(scope.error);
    }

    const limit = parseLimit(req.query.limit);
    const storeWhere = scope.storeId === 'ALL' ? '1=1' : `ISNULL(gr.store_id, 1) = ${Number(scope.storeId)}`;
    const sql = `
      SELECT TOP (${limit})
        gr.id,
        ISNULL(gr.store_id, 1) AS storeId,
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
      WHERE ${storeWhere}
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
  ensureSmartSupplySchema()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`[SERVER] SmartSupply AI API running on http://localhost:${PORT}`);
        console.log(`[DATABASE] Microsoft SQL Server LocalDB (retail_spoilage_db)`);
      });
    })
    .catch((err) => {
      console.error('[SCHEMA INIT ERROR]', err);
      process.exit(1);
    });
}

module.exports = app;
