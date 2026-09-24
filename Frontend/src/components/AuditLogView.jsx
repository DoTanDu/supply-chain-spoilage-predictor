import React, { useState } from 'react';
import { ScrollText, Search, ShieldCheck } from 'lucide-react';

// Helper: Normalize Vietnamese strings without diacritics
function stripVietnamese(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase().trim();
}

export default function AuditLogView({ auditLogs }) {
  const [search, setSearch] = useState('');

  const filteredLogs = (auditLogs || []).filter(log => {
    if (!search.trim()) return true;
    const normSearch = stripVietnamese(search);
    const normUser = stripVietnamese(log?.user || '');
    const normAction = stripVietnamese(log?.action || '');
    const normDetails = stripVietnamese(log?.details || '');
    const tokens = normSearch.split(/\s+/).filter(Boolean);

    return tokens.every(tok => 
      normUser.includes(tok) || normAction.includes(tok) || normDetails.includes(tok)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ScrollText size={22} color="var(--safe-green)" />
              Nhật Ký Kiểm Toán Hệ Thống (System Audit Trail)
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Truy vết toàn bộ thao tác nhập hàng, xuất bán FEFO, phê duyệt tiêu hủy và cảnh báo AI.
            </p>
          </div>

          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
            <input 
              type="text" 
              className="form-input"
              style={{ paddingLeft: '36px' }}
              placeholder="Tìm kiếm log, hành vi, người làm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="modern-table">
            <thead>
              <tr>
                <th>Thời Điểm</th>
                <th>Người Thực Hiện</th>
                <th>Loại Hành Động</th>
                <th>Chi Tiết Giao Dịch & Vết Dữ Liệu</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {log.time}
                  </td>
                  <td>
                    <strong style={{ color: '#ffffff' }}>{log.user}</strong>
                  </td>
                  <td>
                    <span className="badge badge-safe" style={{ fontSize: '0.675rem' }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
