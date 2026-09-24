import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import FefoMonitorView from './components/FefoMonitorView';
import PosCheckoutView from './components/PosCheckoutView';
import DcIntakeView from './components/DcIntakeView';
import SpoilageDisposalView from './components/SpoilageDisposalView';
import ReorderPredictorView from './components/ReorderPredictorView';
import AuditLogView from './components/AuditLogView';

import * as api from './api';

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
  const [liveStats, setLiveStats] = useState(null);
  const [isConnectedToSql, setIsConnectedToSql] = useState(false);

  const [weather, setWeather] = useState({
    temp: 34,
    condition: 'SUNNY',
    isHoliday: false
  });

  // Load Real Data from Microsoft SQL Server LocalDB via Backend API
  const loadLiveDatabaseData = async () => {
    try {
      const [prods, bats, disps, logs, stats] = await Promise.all([
        api.fetchProducts(),
        api.fetchBatches(),
        api.fetchDisposals(),
        api.fetchAuditLogs(),
        api.fetchDashboardStats()
      ]);

      if (prods && prods.length) setProducts(prods);
      if (bats && bats.length) {
        setBatches(bats);
        setRecentIntakes(bats.slice(0, 4));
      }
      if (disps) setDisposals(disps);
      if (logs) setAuditLogs(logs);
      if (stats) setLiveStats(stats);
      setIsConnectedToSql(true);
    } catch (err) {
      console.warn("Backend API not reachable, falling back to local memory:", err);
      setIsConnectedToSql(false);
    }
  };

  useEffect(() => {
    loadLiveDatabaseData();
    const interval = setInterval(loadLiveDatabaseData, 10000); // Auto-sync with SQL Server every 10s
    return () => clearInterval(interval);
  }, []);

  // Calculate critical count
  const criticalCount = batches.filter(b => b.status === 'CRITICAL').length;

  // Handler: Process Sale with FEFO Logic (Write to SQL Server)
  const handleProcessSale = async (cart, weatherInfo) => {
    try {
      const result = await api.apiProcessSale(cart, weatherInfo);
      if (result.success) {
        await loadLiveDatabaseData();
        return result;
      } else {
        return { success: false, message: result.message };
      }
    } catch (err) {
      // Fallback local calculation
      let newBatches = [...batches];
      let newProducts = [...products];
      let fefoDeductions = [];
      let totalSaleAmount = 0;

      for (const item of cart) {
        let remainingToDeduct = item.quantity;
        totalSaleAmount += (item.price * item.quantity);

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
    }
  };

  // Handler: Add new batch from DC Intake (Write to SQL Server)
  const handleAddBatch = async (newBatch) => {
    try {
      await api.apiAddBatch(newBatch);
      await loadLiveDatabaseData();
    } catch (err) {
      setBatches([newBatch, ...batches]);
      setRecentIntakes([newBatch, ...recentIntakes]);
      setProducts(products.map(p => 
        p.id === newBatch.productId ? { ...p, totalStock: p.totalStock + newBatch.quantity } : p
      ));
    }
  };

  // Handler: Quick Discount on near-expiry batch (Update in SQL Server)
  const handleQuickDiscount = async (batchId) => {
    try {
      await api.apiApplyDiscount(batchId, 30);
      await loadLiveDatabaseData();
    } catch (err) {
      const targetBatch = batches.find(b => b.id === batchId);
      if (!targetBatch) return;

      setBatches(batches.map(b => 
        b.id === batchId ? { ...b, isDiscounted: true, discountPercent: 30 } : b
      ));
    }
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

  // Handler: Create Disposal Record (Write to SQL Server)
  const handleCreateDisposal = async (newRecord) => {
    try {
      await api.apiCreateDisposal(newRecord);
      await loadLiveDatabaseData();
    } catch (err) {
      setDisposals([newRecord, ...disposals]);
      if (newRecord.status === 'APPROVED') {
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
      }
    }
  };

  // Handler: Approve Disposal
  const handleApproveDisposal = async (disposalId) => {
    const record = disposals.find(d => d.id === disposalId);
    if (!record) return;

    try {
      await api.apiCreateDisposal({
        ...record,
        status: 'APPROVED'
      });
      await loadLiveDatabaseData();
    } catch (err) {
      setDisposals(disposals.map(d => 
        d.id === disposalId ? { ...d, status: 'APPROVED', approvedBy: 'Đỗ Tấn Du (Store Manager)' } : d
      ));
    }
  };

  // Handler: Add New Product to System Catalog (Write to SQL Server)
  const handleAddNewProduct = async (productData) => {
    try {
      await api.apiCreateProduct(productData);
      await loadLiveDatabaseData();
    } catch (err) {
      console.error("Failed to create product:", err);
    }
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
        isConnectedToSql={isConnectedToSql}
      />

      {/* Main Container */}
      <div style={{ display: 'flex', flex: 1 }}>
        
        {/* Navigation Sidebar */}
        <Sidebar 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentRole={currentRole}
          criticalCount={criticalCount}
          isConnectedToSql={isConnectedToSql}
        />

        {/* Dynamic Workspace */}
        <main style={{ flex: 1, padding: '24px 32px', overflowY: 'auto', maxHeight: 'calc(100vh - 73px)' }}>
          
          {activeTab === 'dashboard' && (
            <DashboardView 
              batches={batches}
              products={products}
              disposals={disposals}
              liveStats={liveStats}
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
              onAddNewProduct={handleAddNewProduct}
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
