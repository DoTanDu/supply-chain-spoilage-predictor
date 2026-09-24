import React, { useState } from 'react';
import { 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  ShieldCheck, 
  FileText, 
  TrendingDown, 
  Lock 
} from 'lucide-react';

export default function SpoilageDisposalView({ 
  disposals, 
  batches, 
  currentRole, 
  onCreateDisposal, 
  onApproveDisposal 
}) {
  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.id || 101);
  const [disposalQty, setDisposalQty] = useState(2);
  const [reason, setReason] = useState('EXPIRED');
  const [notes, setNotes] = useState('');

  // Eligible batches for disposal (has quantity > 0)
  const availableBatches = batches.filter(b => b.quantity > 0);
  const currentSelectedBatch = batches.find(b => b.id === Number(selectedBatchId));

  const totalFinancialLoss = disposals.reduce((sum, d) => sum + d.totalLoss, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentSelectedBatch) return;

    if (disposalQty <= 0 || disposalQty > currentSelectedBatch.quantity) {
      alert(`Số lượng hủy phải từ 1 đến ${currentSelectedBatch.quantity}!`);
      return;
    }

    const newRecord = {
      id: `DISP-${Date.now().toString().slice(-6)}`,
      date: '2026-09-24',
      batchId: currentSelectedBatch.id,
      batchCode: currentSelectedBatch.batchCode,
      productName: currentSelectedBatch.productName,
      quantity: Number(disposalQty),
      costPrice: currentSelectedBatch.costPrice,
      totalLoss: Number(disposalQty) * currentSelectedBatch.costPrice,
      reason: reason === 'EXPIRED' ? 'Quá hạn sử dụng (EXPIRED)' : 
              reason === 'DAMAGED_SHELF' ? 'Rách bao bì trên kệ (DAMAGED_SHELF)' : 
              reason === 'COLD_CHAIN_FAIL' ? 'Lỗi bảo quản lạnh (COLD_CHAIN_FAIL)' : 'Hư hỏng vận chuyển',
      approvedBy: currentRole === 'STORE_MANAGER' ? 'Đỗ Tấn Du (Store Manager)' : 'Chờ phê duyệt',
      status: currentRole === 'STORE_MANAGER' ? 'APPROVED' : 'PENDING'
    };

    onCreateDisposal(newRecord);
    alert(currentRole === 'STORE_MANAGER' ? 
      "Đã lập phiếu và phê duyệt tiêu hủy! Tồn kho đã được trừ sạch." : 
      "Đã lập phiếu đề xuất tiêu hủy! Chờ Cửa hàng trưởng phê duyệt.");
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '24px', alignItems: 'start' }}>
      
      {/* Form: Create Disposal Record */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trash2 size={22} color="#ef4444" />
            Lập Phiếu Tiêu Hủy Hàng Hỏng
          </h2>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Quy tắc: Hạch toán chính xác số tiền thiệt hại = Số lượng hủy × Giá vốn.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
              Chọn Lô hàng cần hủy:
            </label>
            <select 
              className="form-select"
              value={selectedBatchId}
              onChange={(e) => {
                setSelectedBatchId(Number(e.target.value));
                const b = batches.find(x => x.id === Number(e.target.value));
                if (b) setDisposalQty(Math.min(b.quantity, 1));
              }}
            >
              {availableBatches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.batchCode} - {b.productName} (Tồn: {b.quantity} | {b.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
              Số lượng tiêu hủy (Tối đa: {currentSelectedBatch?.quantity || 0}):
            </label>
            <input 
              type="number"
              className="form-input"
              min="1"
              max={currentSelectedBatch?.quantity || 1}
              value={disposalQty}
              onChange={(e) => setDisposalQty(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
              Lý do tiêu hủy:
            </label>
            <select 
              className="form-select"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="EXPIRED">Quá hạn sử dụng (EXPIRED)</option>
              <option value="DAMAGED_SHELF">Rách/vỡ bao bì trên kệ (DAMAGED_SHELF)</option>
              <option value="COLD_CHAIN_FAIL">Lỗi nhiệt độ bảo quản lạnh (COLD_CHAIN_FAIL)</option>
              <option value="TRANSIT_DEFECT">Hư hỏng do vận chuyển từ DC</option>
            </select>
          </div>

          {currentSelectedBatch && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', padding: '12px', fontSize: '0.825rem' }}>
              <div style={{ color: 'var(--text-muted)' }}>Ước tính thiệt hại tài chính:</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ef4444', marginTop: '2px' }}>
                {((disposalQty || 0) * currentSelectedBatch.costPrice).toLocaleString('vi-VN')} đ
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-danger"
            style={{ width: '100%', padding: '12px', marginTop: '6px' }}
          >
            <FileText size={18} /> Gửi Phiếu Tiêu Hủy
          </button>
        </form>

        <div style={{ marginTop: '16px', fontSize: '0.75rem', color: 'var(--text-dim)', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
          * Lưu ý: Nếu thao tác bởi Nhân viên, phiếu sẽ chuyển sang trạng thái <em>Chờ duyệt</em>. Cửa hàng trưởng có quyền bấm phê duyệt ngay.
        </div>
      </div>

      {/* Disposals List & Approval Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Loss Summary Bar */}
        <div className="glass-panel" style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>TỔNG THIỆT HẠI HÀNG HỦY</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444' }}>
              {totalFinancialLoss.toLocaleString('vi-VN')} đ
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span className="badge badge-warning">
              Quyền hiện tại: {currentRole === 'STORE_MANAGER' ? 'Cửa hàng trưởng (Có quyền duyệt)' : 'Nhân viên (Chỉ lập phiếu)'}
            </span>
          </div>
        </div>

        {/* Table of Disposals */}
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="var(--safe-green)" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
              Danh Sách Phiếu Tiêu Hủy Hàng Hóa & Biên Bản Hạch Toán
            </h3>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Mã Phiếu & Ngày</th>
                  <th>Sản Phẩm & Lô</th>
                  <th>Số Lượng</th>
                  <th>Lý Do Hủy</th>
                  <th>Thiệt Hại</th>
                  <th>Trạng Thái / Phê Duyệt</th>
                </tr>
              </thead>
              <tbody>
                {disposals.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#ffffff' }}>{item.id}</div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>{item.date}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.productName}</div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>Lô: {item.batchCode}</div>
                    </td>
                    <td>
                      <strong style={{ color: '#ef4444' }}>-{item.quantity}</strong>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {item.reason}
                    </td>
                    <td>
                      <strong style={{ color: '#f59e0b' }}>{item.totalLoss.toLocaleString('vi-VN')} đ</strong>
                    </td>
                    <td>
                      {item.status === 'APPROVED' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="badge badge-safe" style={{ fontSize: '0.65rem' }}>Đã Phê Duyệt</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{item.approvedBy}</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>Chờ Duyệt</span>
                          {currentRole === 'STORE_MANAGER' ? (
                            <button 
                              className="btn btn-primary"
                              style={{ fontSize: '0.7rem', padding: '4px 8px' }}
                              onClick={() => onApproveDisposal(item.id)}
                            >
                              <ShieldCheck size={12} /> Duyệt Hủy
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Cần Quản lý</span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
