// src/presentation/routes/aiAssistantRoutes.js
const express = require('express');
const aiAssistantService = require('../../domain/services/AiAssistantService');
const authMiddleware = require('../middlewares/authMiddleware');
const { resolveStoreScope } = require('../middlewares/storeScope');

const router = express.Router();

// Yêu cầu xác thực trên toàn bộ endpoint AI Assistant
router.use(authMiddleware);

// GET /api/ai/assistant/status - Kiểm tra server đã cấu hình GEMINI_API_KEY hay chưa (chỉ trả boolean, không lộ key)
router.get('/status', (req, res) => {
  const serverHasApiKey = Boolean(String(process.env.GEMINI_API_KEY || '').trim());
  res.json({
    success: true,
    data: {
      serverHasApiKey,
      model: serverHasApiKey ? 'gemini-2.5-flash' : 'SmartSupply-Rule-Engine-v4'
    }
  });
});

// POST /api/ai/assistant/chat - Hỏi đáp trực tiếp với Trợ lý AI (Gemini LLM hoặc Local Engine theo phạm vi chi nhánh)
router.post('/chat', async (req, res, next) => {
  try {
    const scope = resolveStoreScope(req, req.body?.storeId ?? req.query?.storeId, { adminDefault: 'ALL' });
    if (!scope.ok) {
      return res.status(scope.statusCode).json(scope.error);
    }

    const { message, apiKey } = req.body || {};
    const result = await aiAssistantService.ask({
      message,
      apiKey,
      userRole: req.user?.roleCode || 'STORE_MANAGER',
      storeId: scope.storeId
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/ai/assistant/context - Lấy dữ liệu ngữ cảnh thời gian thực theo phạm vi chi nhánh
router.get('/context', async (req, res, next) => {
  try {
    const scope = resolveStoreScope(req, req.query?.storeId, { adminDefault: 'ALL' });
    if (!scope.ok) {
      return res.status(scope.statusCode).json(scope.error);
    }

    const context = await aiAssistantService.getLiveSystemContext(scope.storeId);
    res.json({
      success: true,
      data: context
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/ai/assistant/quick-insights - Lấy nhận định tóm tắt nhanh theo phạm vi chi nhánh
router.get('/quick-insights', async (req, res, next) => {
  try {
    const scope = resolveStoreScope(req, req.query?.storeId, { adminDefault: 'ALL' });
    if (!scope.ok) {
      return res.status(scope.statusCode).json(scope.error);
    }

    const context = await aiAssistantService.getLiveSystemContext(scope.storeId);
    const inv = context.inventoryStats || {};
    const transferStats = context.transferStats || {};

    const insights = [
      {
        id: 1,
        title: 'Lý giải đề xuất nhập hàng (DOS > DUE)',
        query: 'Tại sao hệ thống khuyến nghị giảm nhập mặt hàng cận date?',
        summary: `Đang theo dõi ${inv.totalBatches || 0} lô tồn kho (${Number(inv.totalUnits || 0).toLocaleString('vi-VN')} ĐV) tại ${context.store?.storeName || 'chuỗi'}.`
      },
      {
        id: 2,
        title: 'Cảnh báo nguy cơ quá hạn 3 ngày tới',
        query: 'Những mặt hàng nào có nguy cơ hủy cao nhất trong 3 ngày tới?',
        summary: `${Number(inv.criticalRedUnits || 0).toLocaleString('vi-VN')} ĐV Vùng Đỏ và ${Number(inv.expiredUnits || 0).toLocaleString('vi-VN')} ĐV quá hạn cần xử lý ngay.`
      }
    ];

    if (!context.isSingleStore) {
      insights.push({
        id: 3,
        title: 'Tối ưu điều phối liên chi nhánh',
        query: 'Tình hình điều phối hàng giữa các chi nhánh hiện tại thế nào?',
        summary: `${transferStats.activeTransfers || 0} phiếu điều chuyển hiệu lực, ước cứu ~${Number(transferStats.totalSavedValue || 0).toLocaleString('vi-VN')} đ.`
      });
    }

    res.json({
      success: true,
      data: insights
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
