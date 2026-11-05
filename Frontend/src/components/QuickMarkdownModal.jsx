import React, { useState, useEffect } from 'react';
import {
  Zap,
  Tag,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  X,
  Printer,
  Sparkles,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

export default function QuickMarkdownModal({
  isOpen,
  onClose,
  batch,
  onApplyMarkdown,
  onOpenPrintSticker,
  canApplyMarkdown = true
}) {
  const [selectedPercent, setSelectedPercent] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (batch && isOpen) {
      if (batch.discountPercent && batch.discountPercent > 0) {
        setSelectedPercent(batch.discountPercent);
      } else if (batch.alertColor === 'RED' || batch.status === 'CRITICAL' || (batch.daysLeft !== undefined && batch.daysLeft <= 3)) {
        setSelectedPercent(40);
      } else {
        setSelectedPercent(30);
      }
    }
  }, [batch, isOpen]);

  if (!isOpen || !batch) return null;

  const originalPrice = Number(batch.retailPrice || batch.price || batch.sellingPrice || 35000);
  const discountedPrice = Math.round(originalPrice * (1 - selectedPercent / 100));
  const saveAmount = originalPrice - discountedPrice;
  const stock = Number(batch.currentQuantity ?? batch.quantity ?? 0);
  const daysLeft = Number(batch.daysLeft ?? 0);

  const discountLevels = [
    { percent: 15, label: 'Giảm 15%', tag: 'Vàng Sớm', color: '#f59e0b', desc: 'Hạn dùng còn > 5 ngày' },
    { percent: 30, label: 'Giảm 30%', tag: 'Vàng Chuẩn', color: '#ea580c', desc: 'Khuyến nghị chuẩn Vùng Vàng' },
    { percent: 40, label: 'Giảm 40%', tag: 'Vùng Đỏ', color: '#dc2626', desc: 'Cận date nguy kịch ≤ 3 ngày' },
    { percent: 50, label: 'Giảm 50%', tag: 'Kịch Sàn', color: '#b91c1c', desc: 'Xả gấp trong ngày tránh hủy' }
  ];

  const handleSubmit = async (percent) => {
    setIsSubmitting(true);
    try {
      if (onApplyMarkdown) {
        await onApplyMarkdown(batch.id, percent);
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--modal-backdrop, rgba(15, 23, 42, 0.45))',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '16px'
    }}>
      <div style={{
        background: 'var(--bg-surface, #ffffff)',
        border: '1px solid var(--border-color, #cbd5e1)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '520px',
        boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header Modal */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-subtle, #f1f5f9)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '9px',
              background: '#fff7ed',
              border: '1px solid #fed7aa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ea580c'
            }}>
              <Zap size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                Kích Hoạt Quick Markdown Xả Hàng
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #475569)' }}>
                Chiết khấu tức thì tại quầy POSChuẩn Tự Động
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted, #475569)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Thông tin Lô Hàng */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{
            background: 'var(--bg-subtle, #f8fafc)',
            border: '1px solid var(--border-subtle, #cbd5e1)',
            borderRadius: '10px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>
                {batch.productName}
              </span>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
                background: daysLeft <= 3 ? '#fff1f2' : '#fffbeb',
                color: daysLeft <= 3 ? '#be123c' : '#b45309',
                border: daysLeft <= 3 ? '1px solid #fda4af' : '1px solid #fcd34d'
              }}>
                HSD: {batch.expiryDate} (Còn {daysLeft} ngày)
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: 'var(--text-muted, #475569)' }}>
              <span>Mã lô: <strong style={{ color: 'var(--primary, #4f46e5)', fontFamily: 'monospace' }}>{batch.batchCode}</strong></span>
              <span>•</span>
              <span>Tồn kệ: <strong style={{ color: '#0284c7' }}>{stock} {batch.unit || 'hộp'}</strong></span>
              <span>•</span>
              <span>Giá gốc: <strong style={{ color: '#0f172a' }}>{originalPrice.toLocaleString('vi-VN')} đ</strong></span>
            </div>
          </div>

          {/* Chọn 4 Mức Giảm Giá */}
          <div>
            <label style={{ fontSize: '0.785rem', fontWeight: 700, color: 'var(--text-main, #0f172a)', marginBottom: '8px', display: 'block' }}>
              Chọn mức chiết khấu Quick Markdown:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {discountLevels.map(lvl => {
                const isSelected = selectedPercent === lvl.percent;
                return (
                  <button
                    key={lvl.percent}
                    type="button"
                    onClick={() => setSelectedPercent(lvl.percent)}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '10px',
                      border: '1px solid',
                      borderColor: isSelected ? lvl.color : 'var(--border-subtle, #cbd5e1)',
                      background: isSelected ? `${lvl.color}18` : 'var(--bg-subtle, #f8fafc)',
                      color: isSelected ? lvl.color : 'var(--text-main, #0f172a)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease',
                      outline: isSelected ? `2px solid ${lvl.color}` : 'none'
                    }}
                  >
                    <span style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                      -{lvl.percent}%
                    </span>
                    <span style={{ fontSize: '0.675rem', fontWeight: 600, color: isSelected ? lvl.color : 'var(--text-muted, #475569)' }}>
                      {lvl.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* So Sánh Giá & Tiết Kiệm */}
          <div style={{
            background: 'linear-gradient(90deg, #fff7ed, #fff1f2)',
            border: '1px solid #fed7aa',
            borderRadius: '10px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #475569)', textDecoration: 'line-through' }}>
                Giá niêm yết: {originalPrice.toLocaleString('vi-VN')} đ
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ea580c' }}>
                  {discountedPrice.toLocaleString('vi-VN')} đ
                </span>
                <span style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 700 }}>
                  (Tiết kiệm {saveAmount.toLocaleString('vi-VN')} đ)
                </span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.685rem', color: 'var(--text-muted, #475569)' }}>Thu hồi tối đa:</span>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0284c7' }}>
                {(discountedPrice * stock).toLocaleString('vi-VN')} đ
              </div>
            </div>
          </div>

          {/* Tùy chọn In Tem Sticker Ngay */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #475569)' }}>
              Tem nhãn dán mặt tiền kệ:
            </span>
            <button
              type="button"
              onClick={() => {
                if (onOpenPrintSticker) {
                  onOpenPrintSticker(batch, selectedPercent);
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: '6px',
                background: '#fff7ed',
                border: '1px solid #ea580c',
                color: '#ea580c',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Printer size={13} />
              <span>Xem & In Tem Sticker</span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--border-subtle, #e2e8f0)',
          background: 'var(--bg-subtle, #f1f5f9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {batch.isDiscounted || (batch.discountPercent && batch.discountPercent > 0) ? (
            <button
              type="button"
              onClick={() => handleSubmit(0)}
              disabled={isSubmitting}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted, #475569)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Khôi phục nguyên giá (0%)
            </button>
          ) : (
            <div />
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #cbd5e1)',
                background: '#ffffff',
                color: 'var(--text-secondary, #334155)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Đóng
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(selectedPercent)}
              disabled={isSubmitting || !canApplyMarkdown}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                background: '#ea580c',
                color: '#ffffff',
                fontSize: '0.825rem',
                fontWeight: 700,
                cursor: (isSubmitting || !canApplyMarkdown) ? 'not-allowed' : 'pointer',
                opacity: (isSubmitting || !canApplyMarkdown) ? 0.7 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(234, 88, 12, 0.3)'
              }}
            >
              <Zap size={15} />
              <span>{isSubmitting ? 'Đang kích hoạt...' : `Kích Hoạt Giảm ${selectedPercent}%`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

