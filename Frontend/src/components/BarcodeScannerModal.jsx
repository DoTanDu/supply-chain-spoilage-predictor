import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, ScanLine, AlertCircle, Sparkles, Volume2, CheckCircle2 } from 'lucide-react';

/**
 * Phát âm thanh Beep khi quét mã vạch thành công (chuẩn máy POS siêu thị)
 */
function playBeepSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, audioCtx.currentTime); // 1200Hz tiếng bíp thanh
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.12);
  } catch (e) {
    // Trình duyệt có thể chặn autoplay nếu chưa có tương tác
  }
}

export default function BarcodeScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
  products = [],
  title = "QUÉT MÃ VẠCH CAMERA (BARCODE SCANNER)",
  subtitle = "Hướng camera vào mã vạch Barcode (EAN-13, Code-128, QR) trên bao bì"
}) {
  const videoRef = useRef(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedSku, setLastScannedSku] = useState('');
  const streamRef = useRef(null);
  const detectIntervalRef = useRef(null);

  // Khởi động Camera khi modal mở
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError('');
    setHasCamera(false);
    setIsScanning(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Trình duyệt không hỗ trợ truy cập Webcam/Camera.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setHasCamera(true);

      // Thử dùng native BarcodeDetector API nếu trình duyệt hỗ trợ (Chrome 83+, Edge)
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new window.BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code', 'upc_a']
        });

        detectIntervalRef.current = setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState === 4) {
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes.length > 0) {
                const detectedCode = barcodes[0].rawValue;
                handleCodeDetected(detectedCode);
              }
            } catch (err) {
              // Bỏ qua lỗi frame đơn lẻ
            }
          }
        }, 300);
      }
    } catch (err) {
      console.warn('Không thể mở camera thực tế:', err);
      setCameraError('Không tìm thấy Camera hoặc chưa cấp quyền truy cập. Bạn có thể sử dụng danh sách mô phỏng quét nhanh bên dưới để thử nghiệm.');
    }
  };

  const stopCamera = () => {
    setIsScanning(false);
    if (detectIntervalRef.current) {
      clearInterval(detectIntervalRef.current);
      detectIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleCodeDetected = (code) => {
    if (!code) return;
    playBeepSound();
    setLastScannedSku(code);

    if (onScanSuccess) {
      onScanSuccess(code);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px'
    }}>
      <div style={{
        background: 'var(--bg-surface-elevated, #ffffff)',
        color: 'var(--text-main, #0f172a)',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '560px',
        border: '1px solid var(--border-color, #cbd5e1)',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh'
      }}>
        {/* Header Modal */}
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-subtle, #f8fafc)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(79, 70, 229, 0.12)',
              color: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Camera size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.925rem', fontWeight: 800 }}>{title}</div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748b)' }}>{subtitle}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted, #64748b)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Khung Quét Video Camera */}
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
          <div style={{
            position: 'relative',
            width: '100%',
            height: '240px',
            background: '#090d16',
            borderRadius: '10px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid rgba(79, 70, 229, 0.3)'
          }}>
            {/* Thẻ Video Camera thật */}
            <video
              ref={videoRef}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: hasCamera ? 'block' : 'none'
              }}
              playsInline
              muted
            />

            {/* Thông báo nếu không có camera */}
            {!hasCamera && (
              <div style={{
                textAlign: 'center',
                padding: '20px',
                color: '#94a3b8',
                fontSize: '0.825rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={28} color="#f59e0b" />
                <div style={{ maxWidth: '320px', lineHeight: 1.4 }}>
                  {cameraError || 'Đang kết nối camera thiết bị...'}
                </div>
              </div>
            )}

            {/* Khung Nhắm Mục Tiêu (Target Reticle) */}
            <div style={{
              position: 'absolute',
              width: '240px',
              height: '140px',
              border: '2px dashed rgba(255, 255, 255, 0.5)',
              borderRadius: '8px',
              pointerEvents: 'none',
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.4)'
            }}>
              {/* Laser Scan Line Animation */}
              <div style={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: '2px',
                background: '#ef4444',
                boxShadow: '0 0 8px #ef4444',
                animation: 'scanLaser 2s infinite ease-in-out'
              }} />
            </div>

            {/* Badge hướng dẫn */}
            <div style={{
              position: 'absolute',
              bottom: '10px',
              background: 'rgba(15, 23, 42, 0.85)',
              color: '#f8fafc',
              fontSize: '0.7rem',
              padding: '4px 10px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <ScanLine size={12} color="#4f46e5" />
              <span>Căn chỉnh mã vạch vào giữa khung nhắm</span>
            </div>
          </div>

          {/* Phản hồi quét thành công gần nhất */}
          {lastScannedSku && (
            <div style={{
              padding: '8px 12px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid #10b981',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.785rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontWeight: 600 }}>
                <CheckCircle2 size={15} />
                <span>Đã quét mã: <strong>{lastScannedSku}</strong></span>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Đã thêm vào giỏ</span>
            </div>
          )}

          {/* Khung Mô Phỏng Quét Nhanh (Phục vụ diễn tập & bảo vệ đồ án trước Hội đồng) */}
          <div style={{
            background: 'var(--bg-subtle, #f8fafc)',
            borderRadius: '8px',
            padding: '10px 12px',
            border: '1px solid var(--border-subtle, #e2e8f0)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <div style={{ fontSize: '0.775rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Sparkles size={13} color="#4f46e5" />
                <span>MÔ PHỎNG QUÉT NHANH BẰNG MÃ SKU CÓ TRONG KHO</span>
              </div>
              <span style={{ fontSize: '0.675rem', color: 'var(--text-muted, #64748b)' }}>1-Click mô phỏng quét camera</span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '130px', overflowY: 'auto' }}>
              {products.slice(0, 8).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleCodeDetected(p.sku)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 9px',
                    borderRadius: '6px',
                    background: 'var(--bg-surface, #ffffff)',
                    border: '1px solid var(--border-color, #cbd5e1)',
                    color: 'var(--text-main, #0f172a)',
                    fontSize: '0.725rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#4f46e5';
                    e.currentTarget.style.background = 'rgba(79, 70, 229, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color, #cbd5e1)';
                    e.currentTarget.style.background = 'var(--bg-surface, #ffffff)';
                  }}
                  title={`Bấm để mô phỏng quét mã barcode: ${p.sku}`}
                >
                  <ScanLine size={12} color="#4f46e5" />
                  <span style={{ fontWeight: 600 }}>{p.name.length > 22 ? p.name.slice(0, 22) + '...' : p.name}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-dim, #94a3b8)', fontFamily: 'monospace' }}>({p.sku})</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Modal */}
        <div style={{
          padding: '10px 18px',
          borderTop: '1px solid var(--border-subtle, #e2e8f0)',
          display: 'flex',
          justifyContent: 'flex-end',
          background: 'var(--bg-subtle, #f8fafc)'
        }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ fontSize: '0.8rem', padding: '6px 16px', borderRadius: '6px' }}
          >
            Đóng Trình Quét
          </button>
        </div>
      </div>

      {/* Style animation cho tia laser */}
      <style>{`
        @keyframes scanLaser {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}</style>
    </div>
  );
}
