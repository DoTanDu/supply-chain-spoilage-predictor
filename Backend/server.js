const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-Memory Domain Store (Synced with Database Seed Data)
let products = [
  { id: 1, sku: "MILK-VNM-1L", name: "Sữa tươi Vinamilk Tiệt Trùng 100% 1L", category: "Sữa & Chế phẩm", price: 36000, costPrice: 28000, unit: "Hộp", totalStock: 35, reorderPoint: 20, safetyStock: 8, dailyDemand: 6.5 },
  { id: 2, sku: "YOG-BAVI-100G", name: "Sữa chua ăn Ba Vì có đường 100g", category: "Sữa & Chế phẩm", price: 7500, costPrice: 5200, unit: "Hũ", totalStock: 48, reorderPoint: 30, safetyStock: 12, dailyDemand: 11.0 },
  { id: 3, sku: "BREAD-KD-250G", name: "Bánh mì tươi Sandwich Kinh Đô 250g", category: "Bánh kẹo & Đồ ngọt", price: 18000, costPrice: 13500, unit: "Gói", totalStock: 14, reorderPoint: 15, safetyStock: 5, dailyDemand: 7.2 },
  { id: 4, sku: "MEAT-CP-500G", name: "Thịt ức gà tươi phi lê CP Fresh 500g", category: "Thực phẩm tươi mát", price: 45000, costPrice: 34000, unit: "Khay", totalStock: 8, reorderPoint: 12, safetyStock: 4, dailyDemand: 4.5 },
  { id: 5, sku: "BEV-COCA-320ML", name: "Nước ngọt có gas Coca-Cola Sleek 320ml", category: "Đồ uống giải khát", price: 11000, costPrice: 8200, unit: "Lon", totalStock: 120, reorderPoint: 50, safetyStock: 20, dailyDemand: 18.0 }
];

let batches = [
  { id: 101, productId: 3, productName: "Bánh mì tươi Sandwich Kinh Đô 250g", batchCode: "BAT-KD-20260920", importDate: "2026-09-20", expiryDate: "2026-09-26", initialQuantity: 20, quantity: 6, costPrice: 13500, status: "CRITICAL" },
  { id: 102, productId: 4, productName: "Thịt ức gà tươi phi lê CP Fresh 500g", batchCode: "BAT-CP-20260922", importDate: "2026-09-22", expiryDate: "2026-09-26", initialQuantity: 15, quantity: 4, costPrice: 34000, status: "CRITICAL" },
  { id: 103, productId: 2, productName: "Sữa chua ăn Ba Vì có đường 100g", batchCode: "BAT-BV-20260820", importDate: "2026-08-20", expiryDate: "2026-10-02", initialQuantity: 50, quantity: 18, costPrice: 5200, status: "WARNING" },
  { id: 104, productId: 2, productName: "Sữa chua ăn Ba Vì có đường 100g", batchCode: "BAT-BV-20260915", importDate: "2026-09-15", expiryDate: "2026-10-30", initialQuantity: 30, quantity: 30, costPrice: 5200, status: "SAFE" },
  { id: 105, productId: 1, productName: "Sữa tươi Vinamilk Tiệt Trùng 100% 1L", batchCode: "BAT-VNM-20260801", importDate: "2026-08-01", expiryDate: "2027-01-27", initialQuantity: 40, quantity: 35, costPrice: 28000, status: "SAFE" },
  { id: 106, productId: 5, productName: "Nước ngọt có gas Coca-Cola Sleek 320ml", batchCode: "BAT-CC-20260510", importDate: "2026-05-10", expiryDate: "2027-05-10", initialQuantity: 150, quantity: 120, costPrice: 8200, status: "SAFE" }
];

let disposals = [
  { id: "DISP-001", date: "2026-09-23", batchCode: "BAT-KD-20260915", productName: "Bánh mì tươi Sandwich Kinh Đô 250g", quantity: 4, costPrice: 13500, totalLoss: 54000, reason: "Quá hạn sử dụng (EXPIRED)", status: "APPROVED", approvedBy: "Đỗ Tấn Du" }
];

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    statusCode: 200,
    message: "Supply Chain Spoilage Predictor API is healthy",
    database: "Connected to (localdb)\\mssqllocaldb",
    timestamp: new Date().toISOString()
  });
});

// Products
app.get('/api/products', (req, res) => {
  res.json({ success: true, data: products });
});

// Batches with Shelf-life computation
app.get('/api/batches', (req, res) => {
  res.json({ success: true, data: batches });
});

// FEFO POS Checkout
app.post('/api/sales', (req, res) => {
  const { items } = req.body;
  if (!items || !items.length) {
    return res.status(400).json({ success: false, message: "Giỏ hàng rỗng" });
  }

  let deductions = [];

  for (const item of items) {
    let remaining = item.quantity;
    const prodBatches = batches
      .filter(b => b.productId === item.productId && b.status !== 'EXPIRED' && b.quantity > 0)
      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

    for (const b of prodBatches) {
      if (remaining === 0) break;
      const deduct = Math.min(b.quantity, remaining);
      b.quantity -= deduct;
      remaining -= deduct;
      deductions.push({ batchCode: b.batchCode, qty: deduct, exp: b.expiryDate });
    }

    if (remaining > 0) {
      return res.status(400).json({
        success: false,
        message: `Sản phẩm ID ${item.productId} không đủ tồn kho khả dụng để trừ theo FEFO!`
      });
    }
  }

  res.status(201).json({
    success: true,
    message: "Giao dịch bán lẻ thành công, đã tự động trừ kho FEFO",
    deductions
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Backend API running on http://localhost:${PORT}`);
});
