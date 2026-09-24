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
  const [preselectedDisposalBatchId, setPreselectedDisposalBatchId] = useState(null);

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
        // Sort by id descending so the latest received batches appear first
        const sortedByRecent = [...bats].sort((a, b) => b.id - a.id);
        setRecentIntakes(sortedByRecent.slice(0, 8));
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
        user: currentRole === 'STORE_MANAGER' ? 'Cửa hàng trưởng (Quản lý)' : 'Nhân viên (Thu ngân)',
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
      const res = await api.apiAddBatch(newBatch);
      await loadLiveDatabaseData();
      return res;
    } catch (err) {
      console.error("Error adding batch:", err);
      return { success: false, message: err.message };
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

  // Handler: Rotate Shelf (Persist to SQL Server and update UI)
  const handleRotateShelf = async (batchId) => {
    const targetBatch = batches.find(b => b.id === batchId);
    if (!targetBatch) return;

    try {
      await api.apiRotateShelf(batchId);
      await loadLiveDatabaseData();
    } catch (err) {
      setBatches(batches.map(b => 
        b.id === batchId ? { ...b, isShelfRotated: 1 } : b
      ));
    }
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
        d.id === disposalId ? { ...d, status: 'APPROVED', approvedBy: 'Cửa hàng trưởng (Quản lý)' } : d
      ));
    }
  };

  // Handler: Add New Product to System Catalog (Write to SQL Server)
  const handleAddNewProduct = async (productData) => {
    try {
      const res = await api.apiCreateProduct(productData);
      if (res && res.success) {
        await loadLiveDatabaseData();
      }
      return res;
    } catch (err) {
      console.error("Failed to create product:", err);
      return { success: false, message: err.message };
    }
  };

  // Handler: Send PO to DC and Replenish Batch in SQL Server
  const handleSendPo = async (product, qty) => {
    const poCode = `PO-DC-${Date.now().toString().slice(-4)}`;
    const batchCode = `BAT-DC-${Date.now().toString().slice(-6)}`;
    
    // Dynamic shelf life from product's standard shelf life (e.g., Bread = 7d, Milk = 180d)
    const shelfLife = Number(product.shelfLifeDays) > 0 ? Number(product.shelfLifeDays) : 30;
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + shelfLife);
    const expiryStr = expDate.toISOString().split('T')[0];
    const importStr = new Date().toISOString().split('T')[0];

    const newBatch = {
      productId: product.id,
      batchCode: batchCode,
      importDate: importStr,
      expiryDate: expiryStr,
      quantity: Number(qty),
      costPrice: product.costPrice || 25000,
      sellingPrice: product.price || 35000,
      updateSellingPrice: false
    };

    try {
      await api.apiAddBatch(newBatch);
      await loadLiveDatabaseData();

      const newLog = {
        id: Date.now(),
        time: new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN'),
        user: currentRole === 'STORE_MANAGER' ? 'Cửa hàng trưởng (Quản lý)' : 'Nhân viên (Thu ngân)',
        action: 'Tiếp nhận hàng từ DC',
        details: `Đơn ${poCode}: Kho tổng DC đã giao +${qty} ${product.unit} ${product.name} (Lô ${batchCode}, HSD: ${expiryStr}). Tồn kho đã tăng thêm!`
      };
      setAuditLogs([newLog, ...auditLogs]);
      return { success: true, batchCode, qty };
    } catch (err) {
      console.error("Lỗi khi tiếp nhận hàng từ DC:", err);
      return { success: false, message: err.message };
    }
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
        batches={batches}
        onNavigateToFefo={() => setActiveTab('fefo-monitor')}
        onQuickDiscount={handleQuickDiscount}
        onRotateShelf={handleRotateShelf}
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
                setPreselectedDisposalBatchId(batch.id);
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
              preselectedBatchId={preselectedDisposalBatchId}
            />
          )}

          {activeTab === 'reorder-predictor' && (
            <ReorderPredictorView 
              products={products}
              batches={batches}
              onSendPo={handleSendPo}
              onQuickDiscount={handleQuickDiscount}
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
