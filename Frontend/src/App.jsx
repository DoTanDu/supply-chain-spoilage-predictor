import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import FefoMonitorView from './components/FefoMonitorView';
import PosCheckoutView from './components/PosCheckoutView';
import DcIntakeView from './components/DcIntakeView';
import SpoilageDisposalView from './components/SpoilageDisposalView';
import ReorderPredictorView from './components/ReorderPredictorView';
import AuditLogView from './components/AuditLogView';

import { 
  initialProducts, 
  initialBatches, 
  initialDisposals, 
  initialAuditLogs 
} from './mockData';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentRole, setCurrentRole] = useState('STORE_MANAGER'); // STORE_MANAGER or STORE_STAFF
  
  const [products, setProducts] = useState(initialProducts);
  const [batches, setBatches] = useState(initialBatches);
  const [disposals, setDisposals] = useState(initialDisposals);
  const [auditLogs, setAuditLogs] = useState(initialAuditLogs);
  const [recentIntakes, setRecentIntakes] = useState(initialBatches.slice(0, 4));

  const [weather, setWeather] = useState({
    temp: 34,
    condition: 'SUNNY',
    isHoliday: false
  });

  // Calculate critical count
  const criticalCount = batches.filter(b => b.status === 'CRITICAL').length;

  // Handler: Process Sale with FEFO Logic
  const handleProcessSale = (cart, weatherInfo) => {
    let newBatches = [...batches];
    let newProducts = [...products];
    let fefoDeductions = [];
    let totalSaleAmount = 0;

    for (const item of cart) {
      let remainingToDeduct = item.quantity;
      totalSaleAmount += (item.price * item.quantity);

      // Find available batches sorted by expiryDate ASC
      const productBatches = newBatches
        .filter(b => b.productId === item.productId && b.status !== 'EXPIRED' && b.quantity > 0)
        .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

      const totalAvailable = productBatches.reduce((sum, b) => sum + b.quantity, 0);
      if (totalAvailable < remainingToDeduct) {
        return {
          success: false,
          message: `Sản phẩm ${item.name} không đủ tồn kho khả dụng để xuất theo FEFO!`
        };
      }

      for (const batch of productBatches) {
        if (remainingToDeduct === 0) break;

        const deductAmount = Math.min(batch.quantity, remainingToDeduct);
        batch.quantity -= deductAmount;
        remainingToDeduct -= deductAmount;

        fefoDeductions.push({
          productName: item.name,
          batchCode: batch.batchCode,
          expiryDate: batch.expiryDate,
          deductedQty: deductAmount,
          unit: item.unit
        });
      }

      // Update total stock on product
      const prodIndex = newProducts.findIndex(p => p.id === item.productId);
      if (prodIndex !== -1) {
        newProducts[prodIndex].totalStock -= item.quantity;
      }
    }

    setBatches(newBatches);
    setProducts(newProducts);

    const orderId = `HD-0924-${Date.now().toString().slice(-4)}`;
    const newLog = {
      id: Date.now(),
      time: new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN'),
      user: currentRole === 'STORE_MANAGER' ? 'Đỗ Tấn Du (Manager)' : 'Đoàn Minh Quân (Staff)',
      action: 'Bán hàng POS (FEFO)',
      details: `Đơn ${orderId}: Tổng ${totalSaleAmount.toLocaleString('vi-VN')} đ. Đã trừ ${fefoDeductions.length} lượt lô theo FEFO.`
    };
    setAuditLogs([newLog, ...auditLogs]);

    return {
      success: true,
      orderCode: orderId,
      totalAmount: totalSaleAmount,
      fefoDetails: fefoDeductions
    };
  };

  // Handler: Add new batch from DC Intake
  const handleAddBatch = (newBatch) => {
    setBatches([newBatch, ...batches]);
    setRecentIntakes([newBatch, ...recentIntakes]);

    // Update product totalStock
    setProducts(products.map(p => 
      p.id === newBatch.productId ? { ...p, totalStock: p.totalStock + newBatch.quantity } : p
    ));

    const newLog = {
      id: Date.now(),
      time: new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN'),
      user: currentRole === 'STORE_MANAGER' ? 'Đỗ Tấn Du (Manager)' : 'Đoàn Minh Quân (Staff)',
      action: 'Nhập lô từ DC',
      details: `Nhập Lô ${newBatch.batchCode}: ${newBatch.quantity} đơn vị ${newBatch.productName}, HSD: ${newBatch.expiryDate}`
    };
    setAuditLogs([newLog, ...auditLogs]);
  };

  // Handler: Quick Discount on near-expiry batch
  const handleQuickDiscount = (batchId) => {
    const targetBatch = batches.find(b => b.id === batchId);
    if (!targetBatch) return;

    setBatches(batches.map(b => 
      b.id === batchId ? { ...b, isDiscounted: true, discountPercent: 30 } : b
    ));

    const newLog = {
      id: Date.now(),
      time: new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN'),
      user: currentRole === 'STORE_MANAGER' ? 'Đỗ Tấn Du (Manager)' : 'Đoàn Minh Quân (Staff)',
      action: 'Xả hàng giảm giá 30%',
      details: `Kích hoạt chương trình xả hàng 30% cho Lô ${targetBatch.batchCode} (${targetBatch.productName})`
    };
    setAuditLogs([newLog, ...auditLogs]);
  };

  // Handler: Rotate Shelf
  const handleRotateShelf = (batchId) => {
    const targetBatch = batches.find(b => b.id === batchId);
    if (!targetBatch) return;

    alert(`Đã ghi nhận hành động: Đảo Lô ${targetBatch.batchCode} (${targetBatch.productName}) ra vị trí ưu tiên mặt trước kệ hàng theo FEFO!`);
    
    const newLog = {
      id: Date.now(),
      time: new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN'),
      user: currentRole === 'STORE_MANAGER' ? 'Đỗ Tấn Du (Manager)' : 'Đoàn Minh Quân (Staff)',
      action: 'Đảo hàng FEFO',
      details: `Nhân viên đã đảo Lô ${targetBatch.batchCode} ra đầu kệ để kích thích khách lấy trước.`
    };
    setAuditLogs([newLog, ...auditLogs]);
  };

  // Handler: Create Disposal Record
  const handleCreateDisposal = (newRecord) => {
    setDisposals([newRecord, ...disposals]);

    if (newRecord.status === 'APPROVED') {
      // Deduct stock of batch immediately
      setBatches(batches.map(b => {
        if (b.id === newRecord.batchId) {
          const rem = Math.max(0, b.quantity - newRecord.quantity);
          return {
            ...b,
            quantity: rem,
            status: rem === 0 ? 'DISPOSED' : b.status
          };
        }
        return b;
      }));

      // Also deduct from product totalStock
      const targetBatch = batches.find(b => b.id === newRecord.batchId);
      if (targetBatch) {
        setProducts(prevProducts => prevProducts.map(p => 
          p.id === targetBatch.productId ? { ...p, totalStock: Math.max(0, p.totalStock - newRecord.quantity) } : p
        ));
      }
    }

    const newLog = {
      id: Date.now(),
      time: new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN'),
      user: currentRole === 'STORE_MANAGER' ? 'Đỗ Tấn Du (Manager)' : 'Đoàn Minh Quân (Staff)',
      action: 'Lập phiếu tiêu hủy',
      details: `Tạo phiếu ${newRecord.id} hủy ${newRecord.quantity} sản phẩm từ Lô ${newRecord.batchCode}. Thiệt hại: ${newRecord.totalLoss.toLocaleString('vi-VN')} đ.`
    };
    setAuditLogs([newLog, ...auditLogs]);
  };

  // Handler: Approve Disposal (Manager only)
  const handleApproveDisposal = (disposalId) => {
    const record = disposals.find(d => d.id === disposalId);
    if (!record) return;

    setDisposals(disposals.map(d => 
      d.id === disposalId ? { ...d, status: 'APPROVED', approvedBy: 'Đỗ Tấn Du (Store Manager)' } : d
    ));

    const targetBatch = batches.find(b => b.batchCode === record.batchCode);

    // Deduct batch stock
    setBatches(batches.map(b => {
      if (b.batchCode === record.batchCode) {
        const rem = Math.max(0, b.quantity - record.quantity);
        return {
          ...b,
          quantity: rem,
          status: rem === 0 ? 'DISPOSED' : b.status
        };
      }
      return b;
    }));

    // Synchronize product totalStock
    if (targetBatch) {
      setProducts(prevProducts => prevProducts.map(p => 
        p.id === targetBatch.productId ? { ...p, totalStock: Math.max(0, p.totalStock - record.quantity) } : p
      ));
    }

    const newLog = {
      id: Date.now(),
      time: new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN'),
      user: 'Đỗ Tấn Du (Store Manager)',
      action: 'Duyệt tiêu hủy hàng hỏng',
      details: `Phê duyệt chính thức phiếu ${record.id}: Trừ kho và hạch toán lỗ ${record.totalLoss.toLocaleString('vi-VN')} đ.`
    };
    setAuditLogs([newLog, ...auditLogs]);
  };

  // Handler: Send PO to DC
  const handleSendPo = (product, qty) => {
    const poCode = `PO-DC-${Date.now().toString().slice(-4)}`;
    const newLog = {
      id: Date.now(),
      time: new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN'),
      user: currentRole === 'STORE_MANAGER' ? 'Đỗ Tấn Du (Manager)' : 'Đoàn Minh Quân (Staff)',
      action: 'Đặt hàng Kho tổng (DC)',
      details: `Khởi tạo đơn ${poCode}: Yêu cầu DC xuất cấp ${qty} ${product.unit} ${product.name} (Chạm ngưỡng ROP=${product.reorderPoint}).`
    };
    setAuditLogs([newLog, ...auditLogs]);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Header */}
      <Header 
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        criticalCount={criticalCount}
        weather={weather}
        setWeather={setWeather}
      />

      {/* Main Container */}
      <div style={{ display: 'flex', flex: 1 }}>
        
        {/* Navigation Sidebar */}
        <Sidebar 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentRole={currentRole}
          criticalCount={criticalCount}
        />

        {/* Dynamic Workspace */}
        <main style={{ flex: 1, padding: '24px 32px', overflowY: 'auto', maxHeight: 'calc(100vh - 73px)' }}>
          
          {activeTab === 'dashboard' && (
            <DashboardView 
              batches={batches}
              products={products}
              disposals={disposals}
              setActiveTab={setActiveTab}
              onQuickDiscount={handleQuickDiscount}
            />
          )}

          {activeTab === 'fefo-monitor' && (
            <FefoMonitorView 
              batches={batches}
              onQuickDiscount={handleQuickDiscount}
              onRotateShelf={handleRotateShelf}
              onOpenDisposalModal={(batch) => {
                setActiveTab('spoilage-disposal');
              }}
            />
          )}

          {activeTab === 'pos-checkout' && (
            <PosCheckoutView 
              products={products}
              batches={batches}
              onProcessSale={handleProcessSale}
              weather={weather}
            />
          )}

          {activeTab === 'dc-intake' && (
            <DcIntakeView 
              products={products}
              onAddBatch={handleAddBatch}
              recentIntakes={recentIntakes}
            />
          )}

          {activeTab === 'spoilage-disposal' && (
            <SpoilageDisposalView 
              disposals={disposals}
              batches={batches}
              currentRole={currentRole}
              onCreateDisposal={handleCreateDisposal}
              onApproveDisposal={handleApproveDisposal}
            />
          )}

          {activeTab === 'reorder-predictor' && (
            <ReorderPredictorView 
              products={products}
              batches={batches}
              onSendPo={handleSendPo}
            />
          )}

          {activeTab === 'audit-log' && (
            <AuditLogView 
              auditLogs={auditLogs}
            />
          )}

        </main>
      </div>

    </div>
  );
}
