import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Download, 
  X, 
  RotateCw, 
  Database, 
  Sparkles,
  HelpCircle,
  FileText,
  Calendar,
  CloudSun
} from 'lucide-react';
import { validatePosCsv, importPosCsv, getPosCsvTemplateUrl } from '../api';

export default function PosCsvImportModal({ 
  isOpen, 
  onClose, 
  onImportSuccess, 
  currentUser 
}) {
  const [csvRawText, setCsvRawText] = useState('');
  const [fileName, setFileName] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setSuccessMessage(null);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setCsvRawText(content);
        await runValidation(content);
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleLoadSampleData = async () => {
    const sampleCsv = [
      'Ma_Giao_Dich,Ngay_Ban,Ma_SKU,Ten_San_Pham,So_Luong,Don_Gia,Thoi_Tiet,Ngay_Le,Chi_Nhanh',
      'HD-20261118-001,2026-11-18,8934567890101,Sữa tươi tiệt trùng Vinamilk 100% Không đường 1L,12,36000,NORMAL,0,RETAIL-STORE-01',
      'HD-20261118-002,2026-11-18,8934567890102,Sữa tươi tiệt trùng Vinamilk 100% Có đường 1L,15,36000,SUNNY,0,RETAIL-STORE-01',
      'HD-20261118-003,2026-11-18,8934567890103,Sữa chua ăn Vinamilk Nha Đam 100g,20,8500,SUNNY,0,RETAIL-STORE-01',
      'HD-20261118-004,2026-11-18,8934567890201,Bánh mì Sandwich tươi Kinh Đô 250g,10,22000,NORMAL,0,RETAIL-STORE-01',
      'HD-20261118-005,2026-11-18,8934567890202,Bánh bao nhân thịt trứng cút Thọ Phát 120g,14,16000,RAINY,0,RETAIL-STORE-01',
      'HD-20261118-006,2026-11-18,8934567890204,Cơm nắm Onigiri cá hồi sốt Mayo 110g,8,18000,NORMAL,0,RETAIL-STORE-01',
      'HD-20261118-007,2026-11-17,8934567890105,Sữa tươi tiệt trùng TH True MILK Nguyên chất 1L,11,37500,NORMAL,0,RETAIL-STORE-01',
      'HD-20261118-008,2026-11-17,8934567890104,Sữa chua uống men sống Probi 130ml,18,10000,SUNNY,1,RETAIL-STORE-01'
    ].join('\r\n');

    setFileName('sample_pos_transactions_8_skus.csv');
    setCsvRawText(sampleCsv);
    setSuccessMessage(null);
    setErrorMessage(null);
    await runValidation(sampleCsv);
  };

  const runValidation = async (content) => {
    setIsValidating(true);
    setErrorMessage(null);
    try {
      const res = await validatePosCsv(content);
      if (res && res.success) {
        setValidationResult(res);
      } else {
        setErrorMessage(res.message || 'Lỗi kiểm tra tính hợp lệ của file CSV!');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Lỗi kết nối máy chủ khi kiểm tra file CSV!');
    } finally {
      setIsValidating(false);
    }
  };

  const handleCommitImport = async () => {
    if (!validationResult || !validationResult.summary?.canImport) return;

    setIsImporting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await importPosCsv(csvRawText, validationResult, 1);
      if (res && res.success) {
        setSuccessMessage(res.message);
        if (onImportSuccess) {
          onImportSuccess(res);
        }
      } else {
        setErrorMessage(res.message || 'Lỗi khi nạp dữ liệu vào CSDL!');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Lỗi thực thi giao dịch SQL!');
    } finally {
      setIsImporting(false);
    }
  };

  const score = validationResult?.dataQualityScore ?? null;
  const summary = validationResult?.summary;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(15, 23, 42, 0.45)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        width: '100%',
        maxWidth: '920px',
        maxHeight: '90vh',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: 'inherit'
      }}>
        
        {/* HEADER */}
        <div style={{
          padding: '16px 22px',
          background: 'linear-gradient(135deg, #1d4ed8 0%, #3730a3 60%, #1e40af 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2)'
            }}>
              <FileSpreadsheet size={20} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 800, fontSize: '15px', letterSpacing: '0.02em' }}>
                  Nhập & Kiểm Tra Dữ Liệu POS (Excel / CSV)
                </span>
                <span style={{
                  padding: '2px 7px',
                  borderRadius: '6px',
                  fontSize: '10px',
                  fontWeight: 800,
                  backgroundColor: '#f59e0b',
                  color: '#451a03',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Mục 07 & Phụ Lục A1
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#dbeafe' }}>
                Đồng bộ lịch sử bán hàng theo chuẩn dữ liệu để huấn luyện AI 1 (LightGBM) & tính điểm ROP
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            title="Đóng modal"
            style={{
              padding: '6px',
              borderRadius: '8px',
              border: 'none',
              background: 'transparent',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 22px',
          backgroundColor: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}>
          
          {/* ACTION BUTTONS & DROPZONE */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Download Template */}
            <a
              href={getPosCsvTemplateUrl()}
              download="sample_pos_transactions.csv"
              style={{
                padding: '9px 15px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#334155',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                textDecoration: 'none',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                cursor: 'pointer'
              }}
              title="Tải file CSV mẫu chuẩn có tiếng Việt UTF-8"
            >
              <Download size={15} color="#2563eb" />
              Tải File Mẫu Chuẩn (.CSV)
            </a>

            {/* Quick Demo Sample Button */}
            <button
              type="button"
              onClick={handleLoadSampleData}
              disabled={isValidating || isImporting}
              style={{
                padding: '9px 15px',
                background: 'linear-gradient(135deg, #d97706, #b45309)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                cursor: isValidating || isImporting ? 'not-allowed' : 'pointer',
                opacity: isValidating || isImporting ? 0.6 : 1,
                boxShadow: '0 2px 4px rgba(217, 119, 6, 0.25)'
              }}
            >
              <Sparkles size={15} color="#fef08a" />
              ⚡ Nạp Nhanh Dữ Liệu Mẫu (8 SKU)
            </button>

            {/* Upload File Input */}
            <label style={{
              flex: 1,
              minWidth: '220px',
              padding: '9px 15px',
              backgroundColor: '#eff6ff',
              border: '1px dashed #60a5fa',
              color: '#1d4ed8',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              cursor: 'pointer',
              boxSizing: 'border-box'
            }}>
              <Upload size={15} color="#2563eb" />
              <span>{fileName ? `Đã chọn: ${fileName}` : 'Chọn hoặc kéo thả file CSV / Excel từ máy tính'}</span>
              <input 
                type="file" 
                accept=".csv,.txt" 
                onChange={handleFileUpload}
                style={{ display: 'none' }} 
              />
            </label>
          </div>

          {/* SUCCESS BANNER */}
          {successMessage && (
            <div style={{
              padding: '14px 16px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              color: '#065f46'
            }}>
              <CheckCircle2 size={18} color="#059669" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div style={{ fontSize: '13px' }}>
                <p style={{ margin: '0 0 4px 0', fontWeight: 700 }}>{successMessage}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#047857' }}>
                  Dữ liệu đã được nạp an toàn vào bảng <code>dbo.sales_history</code>. Tốc độ bán bình quân (d_base) và dự báo AI 1 (LightGBM) sẽ tự động làm mới!
                </p>
              </div>
            </div>
          )}

          {/* ERROR BANNER */}
          {errorMessage && (
            <div style={{
              padding: '14px 16px',
              backgroundColor: '#fff1f2',
              border: '1px solid #fecdd3',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              color: '#9f1239'
            }}>
              <AlertCircle size={18} color="#e11d48" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div style={{ fontSize: '13px' }}>
                <p style={{ margin: '0 0 2px 0', fontWeight: 700 }}>Lỗi xác thực dữ liệu:</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#be123c' }}>{errorMessage}</p>
              </div>
            </div>
          )}

          {/* VALIDATION SUMMARY & KPI CARDS */}
          {validationResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Quality Score Bar */}
              <div style={{
                padding: '14px 18px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Chỉ số Chất lượng Dữ liệu (Data Quality Score):
                    </span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 800,
                      backgroundColor: score >= 90 ? '#d1fae5' : (score >= 60 ? '#fef3c7' : '#fee2e2'),
                      color: score >= 90 ? '#065f46' : (score >= 60 ? '#92400e' : '#991b1b')
                    }}>
                      {score}% ĐẠT CHUẨN
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                    {summary?.validRows}/{summary?.totalRows} dòng hợp lệ
                  </span>
                </div>

                <div style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#f1f5f9',
                  borderRadius: '999px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${score}%`,
                    height: '100%',
                    backgroundColor: score >= 90 ? '#10b981' : (score >= 60 ? '#f59e0b' : '#ef4444'),
                    borderRadius: '999px',
                    transition: 'width 0.4s ease'
                  }} />
                </div>
              </div>

              {/* 4 Cards Summary */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px'
              }}>
                <div style={{
                  padding: '12px 14px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Tổng dòng phân tích
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                    {summary?.totalRows || 0}
                  </div>
                </div>

                <div style={{
                  padding: '12px 14px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #a7f3d0',
                  borderRadius: '12px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <CheckCircle2 size={13} color="#059669" />
                    Dòng hợp lệ
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#047857', marginTop: '4px' }}>
                    {summary?.validRows || 0}
                  </div>
                </div>

                <div style={{
                  padding: '12px 14px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #fecdd3',
                  borderRadius: '12px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#e11d48', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <AlertTriangle size={13} color="#e11d48" />
                    Dòng lỗi / Sai SKU
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#be123c', marginTop: '4px' }}>
                    {summary?.invalidRows || 0}
                  </div>
                </div>

                <div style={{
                  padding: '12px 14px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '12px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>
                    Doanh số dự kiến
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e3a8a', marginTop: '4px' }}>
                    {(summary?.totalEstimatedAmount || 0).toLocaleString('vi-VN')} đ
                  </div>
                </div>
              </div>

              {/* VALIDATED ROWS TABLE */}
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}>
                <div style={{
                  padding: '10px 16px',
                  backgroundColor: '#f1f5f9',
                  borderBottom: '1px solid #cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={14} color="#64748b" />
                    Chi tiết từng giao dịch POS đối chiếu danh mục (80 SKU FMCG)
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Quy chuẩn: SKU chuẩn 3NF · Ngày hợp lệ · Số lượng &gt; 0
                  </span>
                </div>

                <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', color: '#475569', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 1 }}>
                        <th style={{ padding: '8px 10px', fontWeight: 700 }}>#</th>
                        <th style={{ padding: '8px 10px', fontWeight: 700 }}>Mã Hóa Đơn</th>
                        <th style={{ padding: '8px 10px', fontWeight: 700 }}>Ngày Bán</th>
                        <th style={{ padding: '8px 10px', fontWeight: 700 }}>Mã SKU</th>
                        <th style={{ padding: '8px 10px', fontWeight: 700 }}>Tên Sản Phẩm Đối Chiếu</th>
                        <th style={{ padding: '8px 10px', fontWeight: 700, textAlign: 'right' }}>SL</th>
                        <th style={{ padding: '8px 10px', fontWeight: 700, textAlign: 'right' }}>Đơn Giá</th>
                        <th style={{ padding: '8px 10px', fontWeight: 700, textAlign: 'right' }}>Thành Tiền</th>
                        <th style={{ padding: '8px 10px', fontWeight: 700, textAlign: 'center' }}>Thời Tiết</th>
                        <th style={{ padding: '8px 10px', fontWeight: 700, textAlign: 'center' }}>Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validationResult.validatedRows.map((row, idx) => (
                        <tr 
                          key={idx} 
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            backgroundColor: !row.isValid ? '#fff1f2' : (idx % 2 === 0 ? '#ffffff' : '#f8fafc')
                          }}
                        >
                          <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: '#94a3b8' }}>{row.lineIndex}</td>
                          <td style={{ padding: '8px 10px', fontWeight: 600, color: '#1e293b' }}>{row.transactionCode}</td>
                          <td style={{ padding: '8px 10px', color: '#475569', whiteSpace: 'nowrap' }}>{row.saleDate}</td>
                          <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: '#2563eb', fontWeight: 600 }}>{row.sku}</td>
                          <td style={{ padding: '8px 10px', fontWeight: 500, color: '#1e293b', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.productName}>
                            {row.productName}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                            {row.quantitySold || row.rawQuantity}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: '#475569' }}>
                            {(row.salePrice || 0).toLocaleString('vi-VN')} đ
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#1e3a8a' }}>
                            {(row.lineTotal || 0).toLocaleString('vi-VN')} đ
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, backgroundColor: '#e2e8f0', color: '#334155' }}>
                              {row.weather}
                            </span>
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                            {row.isValid ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 7px', borderRadius: '12px', fontSize: '10px', fontWeight: 700, backgroundColor: '#d1fae5', color: '#065f46' }}>
                                <CheckCircle2 size={11} color="#059669" />
                                Hợp lệ
                              </span>
                            ) : (
                              <span 
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 7px', borderRadius: '12px', fontSize: '10px', fontWeight: 700, backgroundColor: '#fee2e2', color: '#991b1b', cursor: 'help' }}
                                title={row.errors.join('; ')}
                              >
                                <AlertTriangle size={11} color="#e11d48" />
                                Lỗi ({row.errors[0]})
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* INITIAL EMPTY STATE */}
          {!validationResult && !isValidating && (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              border: '2px dashed #cbd5e1',
              borderRadius: '14px',
              backgroundColor: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileSpreadsheet size={42} color="#94a3b8" style={{ marginBottom: '10px' }} />
              <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 700, color: '#334155' }}>
                Chưa có dữ liệu POS nào được tải lên
              </h4>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b', maxWidth: '440px', lineHeight: 1.6 }}>
                Bạn có thể tải file mẫu chuẩn <code>.csv</code> về máy, điền giao dịch bán hàng rồi tải lên, hoặc bấm nút <strong>"⚡ Nạp Nhanh Dữ Liệu Mẫu (8 SKU)"</strong> để chạy đối soát ngay lập tức.
              </p>
            </div>
          )}

          {/* LOADING STATE */}
          {isValidating && (
            <div style={{ padding: '40px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <RotateCw size={28} color="#2563eb" style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                Đang đối soát mã SKU với CSDL 80 sản phẩm & kiểm tra tính toàn vẹn...
              </p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div style={{
          padding: '12px 22px',
          backgroundColor: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Database size={14} color="#64748b" />
            <span>Nạp vào bảng: <code>dbo.sales_history</code> (Transaction Safe)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#475569',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Đóng
            </button>

            {validationResult?.summary?.canImport && !successMessage && (
              <button
                type="button"
                onClick={handleCommitImport}
                disabled={isImporting}
                style={{
                  padding: '8px 18px',
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: isImporting ? 'not-allowed' : 'pointer',
                  opacity: isImporting ? 0.6 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
                }}
              >
                {isImporting ? (
                  <>
                    <RotateCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    Đang nạp vào CSDL...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    Xác Nhận Nạp {validationResult.summary.validRows} Giao Dịch Vào CSDL
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
