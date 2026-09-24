const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 1. Health Check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    statusCode: 200,
    message: "Supply Chain Spoilage Predictor API is healthy",
    database: "Microsoft SQL Server LocalDB (retail_spoilage_db)",
    timestamp: new Date().toISOString()
  });
});

// 2. Real Executive Dashboard Stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const stats = await db.getDashboardStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Real Products
app.get('/api/products', async (req, res) => {
  try {
    const products = await db.getProducts();
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Real Batches
app.get('/api/batches', async (req, res) => {
  try {
    const batches = await db.getBatches();
    res.json({ success: true, data: batches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Real Disposals
app.get('/api/disposals', async (req, res) => {
  try {
    const disposals = await db.getDisposals();
    res.json({ success: true, data: disposals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. Real Audit Logs
app.get('/api/audit-logs', async (req, res) => {
  try {
    const logs = await db.getAuditLogs();
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7. Receive New Batch from DC (Insert into SQL Server)
app.post('/api/batches', async (req, res) => {
  try {
    const batchData = req.body;
    await db.insertBatch(batchData);
    res.status(201).json({
      success: true,
      message: `Đã ghi nhận Lô ${batchData.batchCode} vào SQL Server thành công!`
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 8. Process FEFO Sale (Deduct from SQL Server Batches + Record Sales History)
app.post('/api/sales', async (req, res) => {
  try {
    const { items, weather } = req.body;
    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: "Giỏ hàng rỗng" });
    }
    const result = await db.processFefoSale(items, weather || {});
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 9. Record Spoilage Disposal (Insert Spoilage Record + Deduct Batch in SQL Server)
app.post('/api/spoilage', async (req, res) => {
  try {
    const disposalData = req.body;
    await db.recordDisposal(disposalData);
    res.status(201).json({
      success: true,
      message: `Đã lưu phiếu tiêu hủy ${disposalData.id} vào SQL Server và cập nhật tồn kho!`
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 10. Quick Discount (Update Batch in SQL Server)
app.patch('/api/batches/:id/discount', async (req, res) => {
  try {
    const batchId = req.params.id;
    const { percent } = req.body;
    const sql = `
      UPDATE batches 
      SET discount_percent = ${percent || 30} 
      WHERE id = ${batchId};

      INSERT INTO system_audit_logs (user_id, action_type, description, ip_address)
      VALUES (2, N'Xả hàng giảm giá', N'Giảm giá ${percent || 30}% cho Lô ID ${batchId}', '127.0.0.1');
    `;
    await db.executeSql(sql);
    res.json({ success: true, message: `Đã cập nhật giảm giá ${percent || 30}% vào SQL Server!` });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 11. Add New Product to System
app.post('/api/products', async (req, res) => {
  try {
    const { name, categoryId, sku, unit, costPrice, sellingPrice, shelfLifeDays, minStock } = req.body;
    const generatedSku = sku || ('893' + Date.now().toString().slice(-10));
    const sql = `
      INSERT INTO products (
        sku, name, category_id, default_supplier_id, unit, cost_price, selling_price,
        standard_shelf_life_days, min_stock_level, max_stock_level, custom_warning_days, is_active
      ) VALUES (
        N'${generatedSku}', N'${name}', ${categoryId || 1}, 1,
        N'${unit || 'Cái'}', ${costPrice || 10000}, ${sellingPrice || 15000}, ${shelfLifeDays || 30},
        ${minStock || 15}, ${(minStock || 15) * 5}, 3, 1
      );

      INSERT INTO system_audit_logs (user_id, action_type, description, ip_address)
      VALUES (2, N'Thêm sản phẩm mới', N'Tạo mới sản phẩm: ${name} (SKU: ${generatedSku})', '127.0.0.1');
    `;
    await db.executeSql(sql);
    res.status(201).json({ success: true, message: `Đã thêm sản phẩm "${name}" thành công!` });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Backend API running on http://localhost:${PORT}`);
  console.log(`Connected to Microsoft SQL Server LocalDB (retail_spoilage_db)`);
});
