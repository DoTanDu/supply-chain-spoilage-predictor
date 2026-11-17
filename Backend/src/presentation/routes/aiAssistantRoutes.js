// src/presentation/routes/aiAssistantRoutes.js
const express = require('express');
const aiAssistantService = require('../../domain/services/AiAssistantService');

const router = express.Router();

// POST /api/ai/assistant/chat - Hỏi đáp trực tiếp với Trợ lý AI (Gemini LLM hoặc Local Engine)
router.post('/chat', async (req, res, next) => {
  try {
    const { message, apiKey, userRole } = req.body;
    const result = await aiAssistantService.ask({
      message,
      apiKey,
      userRole: userRole || req.user?.roleCode || 'STORE_MANAGER'
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/ai/assistant/context - Lấy dữ liệu ngữ cảnh chuỗi cửa hàng thời gian thực
router.get('/context', async (req, res, next) => {
  try {
    const context = await aiAssistantService.getLiveSystemContext();
    res.json({
      success: true,
      data: context
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/ai/assistant/quick-insights - Lấy các nhận định tóm tắt nhanh cho Dashboard
router.get('/quick-insights', async (req, res, next) => {
  try {
    const context = await aiAssistantService.getLiveSystemContext();
    const insights = [
      {
        id: 1,
        title: 'Lý giải đề xuất nhập hàng (AI 1 & AI 3)',
        query: 'Tại sao hôm nay hệ thống đề xuất giảm nhập bánh sandwich?',
        summary: 'Tồn kho DOS > DUE, tạm dừng đặt mới và ưu tiên kích cầu giảm giá.'
      },
      {
        id: 2,
        title: 'Cảnh báo nguy cơ quá hạn 3 ngày tới (AI 2)',
        query: 'Những mặt hàng nào có nguy cơ hủy cao nhất trong 3 ngày tới?',
        summary: `${context.inventoryStats?.criticalRedUnits || 0} đơn vị thuộc vùng Đỏ cần dán tem Quick Markdown ngay.`
      },
      {
        id: 3,
        title: 'Tối ưu điều phối liên chi nhánh (AI 3)',
        query: 'Tình hình điều phối liên cửa hàng OR-Tools hiện tại thế nào?',
        summary: 'Điều chuyển hàng dư từ Store A sang Store B giúp tiết kiệm chi phí tiêu hủy.'
      }
    ];

    res.json({
      success: true,
      data: insights
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
