// src/container.js
// Dependency Injection Container (Clean Architecture)

// 1. Repositories
const SqlUserRepository = require('./infrastructure/database/repositories/SqlUserRepository');
const SqlStoreProfileRepository = require('./infrastructure/database/repositories/SqlStoreProfileRepository');
const SqlCategoryRepository = require('./infrastructure/database/repositories/SqlCategoryRepository');
const SqlProductRepository = require('./infrastructure/database/repositories/SqlProductRepository');
const SqlBatchRepository = require('./infrastructure/database/repositories/SqlBatchRepository');
const SqlSaleRepository = require('./infrastructure/database/repositories/SqlSaleRepository');
const SqlSpoilageRepository = require('./infrastructure/database/repositories/SqlSpoilageRepository');
const SqlPurchaseOrderRepository = require('./infrastructure/database/repositories/SqlPurchaseOrderRepository');
const SqlGoodsReceiptRepository = require('./infrastructure/database/repositories/SqlGoodsReceiptRepository');
const SqlAuditLogRepository = require('./infrastructure/database/repositories/SqlAuditLogRepository');

// 2. Use Cases
const ReceiveDCBatchUseCase = require('./application/use-cases/batch/ReceiveDCBatchUseCase');
const ApplyQuickMarkdownUseCase = require('./application/use-cases/batch/ApplyQuickMarkdownUseCase');
const RotateShelfFefoUseCase = require('./application/use-cases/batch/RotateShelfFefoUseCase');
const GetBatchAlertsUseCase = require('./application/use-cases/batch/GetBatchAlertsUseCase');

const ProcessFefoSaleUseCase = require('./application/use-cases/sales/ProcessFefoSaleUseCase');
const GetSalesHistoryUseCase = require('./application/use-cases/sales/GetSalesHistoryUseCase');
const GetSaleReceiptUseCase = require('./application/use-cases/sales/GetSaleReceiptUseCase');

const DisposeSpoiledGoodsUseCase = require('./application/use-cases/spoilage/DisposeSpoiledGoodsUseCase');
const GetSpoilageLedgerUseCase = require('./application/use-cases/spoilage/GetSpoilageLedgerUseCase');

const CalculateROPForecastUseCase = require('./application/use-cases/forecast/CalculateROPForecastUseCase');
const CreatePurchaseOrderUseCase = require('./application/use-cases/forecast/CreatePurchaseOrderUseCase');
const UpdatePurchaseOrderStatusUseCase = require('./application/use-cases/forecast/UpdatePurchaseOrderStatusUseCase');

const GetDashboardOverviewUseCase = require('./application/use-cases/dashboard/GetDashboardOverviewUseCase');
const ChangePasswordUseCase = require('./application/use-cases/auth/ChangePasswordUseCase');
const CreateUserUseCase = require('./application/use-cases/auth/CreateUserUseCase');

const SubmitShiftHandoverUseCase = require('./application/use-cases/shift/SubmitShiftHandoverUseCase');
const GetShiftSummaryUseCase = require('./application/use-cases/shift/GetShiftSummaryUseCase');
const GetShiftHandoverHistoryUseCase = require('./application/use-cases/shift/GetShiftHandoverHistoryUseCase');

// 3. Controllers
const BatchController = require('./presentation/controllers/BatchController');
const SalesController = require('./presentation/controllers/SalesController');
const SpoilageController = require('./presentation/controllers/SpoilageController');
const ForecastController = require('./presentation/controllers/ForecastController');
const DashboardController = require('./presentation/controllers/DashboardController');
const ShiftHandoverController = require('./presentation/controllers/ShiftHandoverController');

// Initialize Repositories (Singletons)
const userRepository = new SqlUserRepository();
const storeProfileRepository = new SqlStoreProfileRepository();
const categoryRepository = new SqlCategoryRepository();
const productRepository = new SqlProductRepository();
const batchRepository = new SqlBatchRepository();
const saleRepository = new SqlSaleRepository();
const spoilageRepository = new SqlSpoilageRepository();
const purchaseOrderRepository = new SqlPurchaseOrderRepository();
const goodsReceiptRepository = new SqlGoodsReceiptRepository();
const auditLogRepository = new SqlAuditLogRepository();

// Initialize Use Cases
const receiveDCBatchUseCase = new ReceiveDCBatchUseCase({
  goodsReceiptRepository,
  productRepository,
  storeProfileRepository,
  purchaseOrderRepository,
  auditLogRepository
});

const applyQuickMarkdownUseCase = new ApplyQuickMarkdownUseCase({
  batchRepository,
  auditLogRepository
});

const rotateShelfFefoUseCase = new RotateShelfFefoUseCase({
  batchRepository,
  auditLogRepository
});

const getBatchAlertsUseCase = new GetBatchAlertsUseCase({
  batchRepository
});

const processFefoSaleUseCase = new ProcessFefoSaleUseCase({
  saleRepository,
  batchRepository,
  productRepository,
  storeProfileRepository,
  auditLogRepository
});

const getSalesHistoryUseCase = new GetSalesHistoryUseCase({
  saleRepository
});

const getSaleReceiptUseCase = new GetSaleReceiptUseCase({
  saleRepository,
  storeProfileRepository
});

const disposeSpoiledGoodsUseCase = new DisposeSpoiledGoodsUseCase({
  spoilageRepository,
  batchRepository,
  auditLogRepository
});

const getSpoilageLedgerUseCase = new GetSpoilageLedgerUseCase({
  spoilageRepository
});

const calculateROPForecastUseCase = new CalculateROPForecastUseCase({
  productRepository,
  saleRepository,
  batchRepository,
  storeProfileRepository
});

const createPurchaseOrderUseCase = new CreatePurchaseOrderUseCase({
  purchaseOrderRepository,
  auditLogRepository
});

const updatePurchaseOrderStatusUseCase = new UpdatePurchaseOrderStatusUseCase({
  purchaseOrderRepository,
  auditLogRepository
});

const getDashboardOverviewUseCase = new GetDashboardOverviewUseCase({
  batchRepository,
  saleRepository,
  spoilageRepository,
  storeProfileRepository,
  productRepository,
  categoryRepository
});

const changePasswordUseCase = new ChangePasswordUseCase(userRepository, auditLogRepository);
const createUserUseCase = new CreateUserUseCase(userRepository, auditLogRepository);

// Initialize Controllers
const batchController = new BatchController({
  getBatchAlertsUseCase,
  receiveDCBatchUseCase,
  applyQuickMarkdownUseCase,
  rotateShelfFefoUseCase,
  batchRepository,
  productRepository,
  storeProfileRepository,
  auditLogRepository
});

const salesController = new SalesController({
  processFefoSaleUseCase,
  getSalesHistoryUseCase,
  getSaleReceiptUseCase
});

const spoilageController = new SpoilageController({
  disposeSpoiledGoodsUseCase,
  getSpoilageLedgerUseCase,
  spoilageRepository,
  auditLogRepository
});

const forecastController = new ForecastController({
  calculateROPForecastUseCase,
  createPurchaseOrderUseCase,
  updatePurchaseOrderStatusUseCase,
  purchaseOrderRepository
});

const dashboardController = new DashboardController({
  getDashboardOverviewUseCase
});

const submitShiftHandoverUseCase = new SubmitShiftHandoverUseCase({
  auditLogRepository
});

const getShiftSummaryUseCase = new GetShiftSummaryUseCase({
  saleRepository,
  batchRepository,
  spoilageRepository,
  userRepository
});

const getShiftHandoverHistoryUseCase = new GetShiftHandoverHistoryUseCase({
  auditLogRepository
});

const shiftHandoverController = new ShiftHandoverController({
  submitShiftHandoverUseCase,
  getShiftSummaryUseCase,
  getShiftHandoverHistoryUseCase
});

module.exports = {
  // Repositories
  userRepository,
  storeProfileRepository,
  categoryRepository,
  productRepository,
  batchRepository,
  saleRepository,
  spoilageRepository,
  purchaseOrderRepository,
  goodsReceiptRepository,
  auditLogRepository,

  // Use Cases
  receiveDCBatchUseCase,
  applyQuickMarkdownUseCase,
  rotateShelfFefoUseCase,
  getBatchAlertsUseCase,
  processFefoSaleUseCase,
  getSalesHistoryUseCase,
  getSaleReceiptUseCase,
  disposeSpoiledGoodsUseCase,
  getSpoilageLedgerUseCase,
  calculateROPForecastUseCase,
  createPurchaseOrderUseCase,
  updatePurchaseOrderStatusUseCase,
  getDashboardOverviewUseCase,
  changePasswordUseCase,
  createUserUseCase,
  submitShiftHandoverUseCase,
  getShiftSummaryUseCase,
  getShiftHandoverHistoryUseCase,

  // Controllers
  batchController,
  salesController,
  spoilageController,
  forecastController,
  dashboardController,
  shiftHandoverController
};
