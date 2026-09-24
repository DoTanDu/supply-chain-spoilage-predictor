// Mock Data mirrors SQL Server Database for Supply Chain Spoilage Predictor
export const initialProducts = [
  {
    id: 1,
    sku: "MILK-VNM-1L",
    name: "Sữa tươi Vinamilk Tiệt Trùng 100% 1L",
    category: "Sữa & Chế phẩm",
    price: 36000,
    costPrice: 28000,
    unit: "Hộp",
    totalStock: 35,
    reorderPoint: 20,
    safetyStock: 8,
    dailyDemand: 6.5,
    shelfLifeDays: 180,
    image: "🥛"
  },
  {
    id: 2,
    sku: "YOG-BAVI-100G",
    name: "Sữa chua ăn Ba Vì có đường 100g",
    category: "Sữa & Chế phẩm",
    price: 7500,
    costPrice: 5200,
    unit: "Hũ",
    totalStock: 48,
    reorderPoint: 30,
    safetyStock: 12,
    dailyDemand: 11.0,
    shelfLifeDays: 45,
    image: "🥣"
  },
  {
    id: 3,
    sku: "BREAD-KD-250G",
    name: "Bánh mì tươi Sandwich Kinh Đô 250g",
    category: "Bánh kẹo & Đồ ngọt",
    price: 18000,
    costPrice: 13500,
    unit: "Gói",
    totalStock: 14,
    reorderPoint: 15,
    safetyStock: 5,
    dailyDemand: 7.2,
    shelfLifeDays: 7,
    image: "🍞"
  },
  {
    id: 4,
    sku: "MEAT-CP-500G",
    name: "Thịt ức gà tươi phi lê CP Fresh 500g",
    category: "Thực phẩm tươi mát",
    price: 45000,
    costPrice: 34000,
    unit: "Khay",
    totalStock: 8,
    reorderPoint: 12,
    safetyStock: 4,
    dailyDemand: 4.5,
    shelfLifeDays: 5,
    image: "🍗"
  },
  {
    id: 5,
    sku: "BEV-COCA-320ML",
    name: "Nước ngọt có gas Coca-Cola Sleek 320ml",
    category: "Đồ uống giải khát",
    price: 11000,
    costPrice: 8200,
    unit: "Lon",
    totalStock: 120,
    reorderPoint: 50,
    safetyStock: 20,
    dailyDemand: 18.0,
    shelfLifeDays: 365,
    image: "🥤"
  },
  {
    id: 6,
    sku: "SAUS-VIS-175G",
    name: "Xúc xích tiệt trùng Vissan Bò Tiêu 175g",
    category: "Thực phẩm chế biến",
    price: 24000,
    costPrice: 18000,
    unit: "Gói",
    totalStock: 26,
    reorderPoint: 20,
    safetyStock: 6,
    dailyDemand: 5.0,
    shelfLifeDays: 90,
    image: "🌭"
  }
];

export const initialBatches = [
  // Red Alert - Critical (<= 3 days remaining)
  {
    id: 101,
    productId: 3,
    productName: "Bánh mì tươi Sandwich Kinh Đô 250g",
    batchCode: "BAT-KD-20260920",
    importDate: "2026-09-20",
    expiryDate: "2026-09-26", // 2 days left
    initialQuantity: 20,
    quantity: 6,
    costPrice: 13500,
    status: "CRITICAL",
    category: "Bánh kẹo & Đồ ngọt"
  },
  // Red Alert - Critical
  {
    id: 102,
    productId: 4,
    productName: "Thịt ức gà tươi phi lê CP Fresh 500g",
    batchCode: "BAT-CP-20260922",
    importDate: "2026-09-22",
    expiryDate: "2026-09-26", // 2 days left
    initialQuantity: 15,
    quantity: 4,
    costPrice: 34000,
    status: "CRITICAL",
    category: "Thực phẩm tươi mát"
  },
  // Yellow Alert - Warning (10 - 20% RSL)
  {
    id: 103,
    productId: 2,
    productName: "Sữa chua ăn Ba Vì có đường 100g",
    batchCode: "BAT-BV-20260820",
    importDate: "2026-08-20",
    expiryDate: "2026-10-02", // 8 days left
    initialQuantity: 50,
    quantity: 18,
    costPrice: 5200,
    status: "WARNING",
    category: "Sữa & Chế phẩm"
  },
  // Green - Safe (> 20% RSL)
  {
    id: 104,
    productId: 2,
    productName: "Sữa chua ăn Ba Vì có đường 100g",
    batchCode: "BAT-BV-20260915",
    importDate: "2026-09-15",
    expiryDate: "2026-10-30", // 36 days left
    initialQuantity: 30,
    quantity: 30,
    costPrice: 5200,
    status: "SAFE",
    category: "Sữa & Chế phẩm"
  },
  // Green - Safe
  {
    id: 105,
    productId: 1,
    productName: "Sữa tươi Vinamilk Tiệt Trùng 100% 1L",
    batchCode: "BAT-VNM-20260801",
    importDate: "2026-08-01",
    expiryDate: "2027-01-27", // 125 days left
    initialQuantity: 40,
    quantity: 35,
    costPrice: 28000,
    status: "SAFE",
    category: "Sữa & Chế phẩm"
  },
  // Green - Safe
  {
    id: 106,
    productId: 5,
    productName: "Nước ngọt có gas Coca-Cola Sleek 320ml",
    batchCode: "BAT-CC-20260510",
    importDate: "2026-05-10",
    expiryDate: "2027-05-10", // Long date
    initialQuantity: 150,
    quantity: 120,
    costPrice: 8200,
    status: "SAFE",
    category: "Đồ uống giải khát"
  },
  // Expired - Locked POS
  {
    id: 107,
    productId: 3,
    productName: "Bánh mì tươi Sandwich Kinh Đô 250g",
    batchCode: "BAT-KD-20260915",
    importDate: "2026-09-15",
    expiryDate: "2026-09-22", // Expired 2 days ago
    initialQuantity: 20,
    quantity: 4,
    costPrice: 13500,
    status: "EXPIRED",
    category: "Bánh kẹo & Đồ ngọt"
  }
];

export const initialDisposals = [
  {
    id: "DISP-20260923-01",
    date: "2026-09-23",
    batchCode: "BAT-KD-20260915",
    productName: "Bánh mì tươi Sandwich Kinh Đô 250g",
    quantity: 4,
    costPrice: 13500,
    totalLoss: 54000,
    reason: "Quá hạn sử dụng (EXPIRED)",
    approvedBy: "Cửa hàng trưởng (Quản lý)",
    status: "APPROVED"
  },
  {
    id: "DISP-20260918-02",
    date: "2026-09-18",
    batchCode: "BAT-CP-20260912",
    productName: "Thịt ức gà tươi phi lê CP Fresh 500g",
    quantity: 2,
    costPrice: 34000,
    totalLoss: 68000,
    reason: "Rách bao bì chân không (DAMAGED_SHELF)",
    approvedBy: "Cửa hàng trưởng (Quản lý)",
    status: "APPROVED"
  }
];

export const initialAuditLogs = [
  {
    id: 1,
    time: "2026-09-24 19:45:10",
    user: "Nhân viên (Thu ngân)",
    action: "Bán hàng POS (FEFO)",
    details: "Đơn HD-0924-004: Trừ 2 lon Coca-Cola Sleek từ Lô BAT-CC-20260510"
  },
  {
    id: 2,
    time: "2026-09-24 18:20:30",
    user: "Cửa hàng trưởng (Quản lý)",
    action: "Duyệt Tiêu hủy",
    details: "Phê duyệt phiếu tiêu hủy DISP-20260923-01: Hủy 4 gói Bánh mì hết hạn"
  },
  {
    id: 3,
    time: "2026-09-24 16:15:00",
    user: "Nhân viên (Thu ngân)",
    action: "Nhập lô từ DC",
    details: "Nhập Lô BAT-BV-20260915: 30 hũ Sữa chua Ba Vì, HSD: 30/10/2026"
  },
  {
    id: 4,
    time: "2026-09-24 08:00:00",
    user: "Hệ thống AI",
    action: "Cảnh báo RSL",
    details: "Phát hiện 2 lô hàng rơi vào vùng đỏ (Critical): BAT-KD-20260920, BAT-CP-20260922"
  }
];
