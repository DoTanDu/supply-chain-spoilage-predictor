import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Sparkles,
  X,
  Send,
  RefreshCw,
  Key,
  RotateCw,
  Minimize2,
  Maximize2,
  ChevronRight
} from 'lucide-react';
import { askAiAssistant, fetchAiAssistantStatus } from '../api';

function buildWelcomeMessage({ fullName, isSingleStore }) {
  const transferBullet = isSingleStore
    ? ''
    : `\n- 🔄 **Điều phối chi nhánh:** Tối ưu luân chuyển hàng dư–thiếu giữa các cửa hàng.`;

  const suggestions = [
    'Tại sao hệ thống khuyến nghị giảm nhập mặt hàng cận date?',
    'Những mặt hàng nào có nguy cơ hủy cao nhất trong 3 ngày tới?',
    ...(isSingleStore ? [] : ['Tình hình điều phối hàng giữa các chi nhánh hiện tại thế nào?']),
    'Báo cáo tổng kết tồn kho và hao hụt hôm nay'
  ].slice(0, isSingleStore ? 3 : 4);

  return {
    id: 'welcome',
    sender: 'ai',
    text: `### 👋 Xin chào ${fullName || 'Quản lý'}! Tôi là Trợ lý SmartSupply AI

Tôi hỗ trợ **giải thích số liệu và đề xuất quyết định** trực tiếp từ dữ liệu SQL Server theo đúng chi nhánh bạn đang xem:
- 📈 **Dự báo nhu cầu & ROP:** Giải thích khuyến nghị tăng/giảm nhập hàng và cảnh báo tồn dư (DOS > DUE).
- ⚠️ **Kiểm soát rủi ro hạn dùng:** Tổng hợp nhanh lô Vùng Đỏ, Vùng Vàng và hàng quá hạn cần xử lý.${transferBullet}

Bạn có thể bấm vào các câu hỏi gợi ý bên dưới hoặc đặt câu hỏi trực tiếp.`,
    timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    mode: 'SYSTEM',
    suggestedQuestions: suggestions
  };
}

export default function AiAssistantModal({
  isOpen,
  onClose,
  currentUser,
  selectedStoreId = 'ALL',
  isSingleStore = false
}) {
  const [messages, setMessages] = useState(() => [
    buildWelcomeMessage({ fullName: currentUser?.fullName, isSingleStore })
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState(() => {
    try {
      return sessionStorage.getItem('gemini_api_key') || '';
    } catch {
      return '';
    }
  });
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [activeEngineMode, setActiveEngineMode] = useState('LOCAL_INTELLIGENCE_ENGINE');
  const [serverHasApiKey, setServerHasApiKey] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const messagesEndRef = useRef(null);
  const msgCounterRef = useRef(1);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;
    fetchAiAssistantStatus()
      .then((res) => {
        if (!cancelled && res?.success && res?.data) {
          setServerHasApiKey(Boolean(res.data.serverHasApiKey));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const handleSaveApiKey = (key) => {
    const trimmed = String(key || '').trim();
    setGeminiApiKey(trimmed);
    try {
      if (trimmed) {
        sessionStorage.setItem('gemini_api_key', trimmed);
      } else {
        sessionStorage.removeItem('gemini_api_key');
      }
    } catch {
      // Ignore storage quota / privacy mode errors
    }
    setShowKeyConfig(false);
  };

  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || loading) return;

    const seq = ++msgCounterRef.current;
    const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      id: `user_${seq}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: nowTime
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInputMessage('');
    setLoading(true);

    try {
      const res = await askAiAssistant(textToSend.trim(), geminiApiKey, selectedStoreId);
      const replyTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      if (res && res.reply) {
        setActiveEngineMode(res.mode || 'LOCAL_INTELLIGENCE_ENGINE');
        setMessages(prev => [
          ...prev,
          {
            id: `ai_${seq}`,
            sender: 'ai',
            text: res.reply,
            timestamp: replyTime,
            mode: res.mode,
            model: res.model,
            suggestedQuestions: res.suggestedQuestions || []
          }
        ]);
      } else {
        throw new Error(res?.message || 'Không nhận được phản hồi từ Trợ lý AI');
      }
    } catch (err) {
      const errTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      setMessages(prev => [
        ...prev,
        {
          id: `err_${seq}`,
          sender: 'ai',
          text: `⚠️ **Không thể xử lý yêu cầu:** ${err.message}`,
          timestamp: errTime,
          mode: 'ERROR'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatInline = (str) => {
    const parts = str.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ fontWeight: 700, color: '#0f172a' }}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={i}
            style={{
              padding: '1px 5px',
              margin: '0 2px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '4px',
              fontSize: '11px',
              fontFamily: 'Consolas, monospace',
              color: '#1d4ed8',
              fontWeight: 600
            }}
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const renderFormattedMarkdown = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return (
          <div
            key={idx}
            style={{
              fontSize: '14px',
              fontWeight: 800,
              color: '#1e3a8a',
              margin: '8px 0 6px 0',
              paddingBottom: '4px',
              borderBottom: '1px dashed #cbd5e1'
            }}
          >
            {line.replace('### ', '')}
          </div>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <div key={idx} style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: '10px 0 6px 0' }}>
            {line.replace('## ', '')}
          </div>
        );
      }
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const content = line.trim().replace(/^[-*]\s+/, '');
        return (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              fontSize: '13px',
              color: '#334155',
              lineHeight: 1.55,
              margin: '4px 0 4px 4px'
            }}
          >
            <span style={{ color: '#2563eb', fontWeight: 'bold', minWidth: '8px' }}>•</span>
            <span style={{ flex: 1 }}>{formatInline(content)}</span>
          </div>
        );
      }
      if (/^\d+\.\s+/.test(line.trim())) {
        const num = line.trim().match(/^(\d+)\.\s+/)[1];
        const content = line.trim().replace(/^\d+\.\s+/, '');
        return (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              fontSize: '13px',
              color: '#334155',
              lineHeight: 1.55,
              margin: '5px 0'
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: '#eff6ff',
                color: '#1d4ed8',
                fontSize: '11px',
                fontWeight: 800,
                flexShrink: 0,
                marginTop: '2px'
              }}
            >
              {num}
            </span>
            <span style={{ flex: 1 }}>{formatInline(content)}</span>
          </div>
        );
      }
      if (!line.trim()) {
        return <div key={idx} style={{ height: '6px' }} />;
      }
      return (
        <p key={idx} style={{ fontSize: '13px', color: '#334155', lineHeight: 1.55, margin: '4px 0' }}>
          {formatInline(line)}
        </p>
      );
    });
  };

  if (!isOpen) return null;

  const engineLabel =
    activeEngineMode === 'GEMINI_LLM'
      ? 'Gemini 2.5 Flash (LLM Live)'
      : geminiApiKey
        ? 'Gemini Live (Key phiên hiện tại)'
        : serverHasApiKey
          ? 'Gemini 2.5 Flash (Backend .env)'
          : 'SmartSupply Local Engine (SQL Live)';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Trợ lý AI SmartSupply"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        padding: '20px',
        backgroundColor: 'rgba(15, 23, 42, 0.35)',
        backdropFilter: 'blur(3px)',
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          width: isExpanded ? '700px' : '450px',
          height: isExpanded ? '84vh' : '610px',
          maxHeight: '90vh',
          maxWidth: '100%',
          borderRadius: '16px',
          boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.3), 0 0 0 1px rgba(15, 23, 42, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'width 0.2s ease, height 0.2s ease',
          fontFamily: 'inherit'
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: '13px 16px',
            background: 'linear-gradient(135deg, #1d4ed8 0%, #4338ca 60%, #2563eb 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Bot size={19} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <span style={{ fontWeight: 800, fontSize: '14px' }}>
                  Trợ lý SmartSupply AI
                </span>
                <span
                  style={{
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontSize: '9px',
                    fontWeight: 800,
                    background: '#10b981',
                    color: '#ffffff',
                    textTransform: 'uppercase'
                  }}
                >
                  Live
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#dbeafe', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '1px' }}>
                <Sparkles size={11} color="#fde047" />
                <span>Giải thích Báo cáo & Hỗ trợ Ra quyết định</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              type="button"
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              title="Cấu hình Google Gemini API Key"
              aria-label="Cấu hình Google Gemini API Key"
              style={{
                background: geminiApiKey || serverHasApiKey ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
                border: 'none',
                color: geminiApiKey || serverHasApiKey ? '#fde047' : '#ffffff',
                padding: '6px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Key size={15} />
            </button>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Thu nhỏ' : 'Mở rộng'}
              aria-label={isExpanded ? 'Thu nhỏ cửa sổ AI' : 'Mở rộng cửa sổ AI'}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                padding: '6px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Đóng trợ lý"
              aria-label="Đóng Trợ lý AI"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                padding: '6px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* STATUS SUB-BAR */}
        <div
          style={{
            padding: '6px 14px',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#475569'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#10b981'
              }}
            />
            <span>Chế độ:</span>
            <strong style={{ color: '#0f172a' }}>{engineLabel}</strong>
          </div>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '10px',
              backgroundColor: '#e2e8f0',
              color: '#334155'
            }}
          >
            {selectedStoreId === 'ALL' ? 'Toàn chuỗi' : `CN #${selectedStoreId}`}
          </span>
        </div>

        {/* API KEY CONFIG PANEL */}
        {showKeyConfig && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#fffbeb',
              borderBottom: '1px solid #fde68a',
              fontSize: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontWeight: 700, color: '#92400e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Key size={13} color="#d97706" />
                Cấu hình Google Gemini API Key (Tùy chọn)
              </span>
              <button
                type="button"
                onClick={() => setShowKeyConfig(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400e' }}
              >
                <X size={13} />
              </button>
            </div>
            <p style={{ margin: '0 0 8px 0', color: '#78350f', fontSize: '11px', lineHeight: 1.45 }}>
              Dán Google Gemini API Key để bật LLM trực tiếp (chỉ lưu tạm trong phiên trình duyệt). Nếu để trống, hệ thống dùng Local Engine đọc dữ liệu SQL Server trực tiếp.
            </p>
            {serverHasApiKey && (
              <p style={{ margin: '0 0 8px 0', padding: '5px 8px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px', color: '#047857', fontSize: '11px', lineHeight: 1.4 }}>
                Máy chủ đã cấu hình sẵn <code>GEMINI_API_KEY</code> trong <code>Backend/.env</code> (không cần nhập lại; nhập ở đây sẽ tạm ghi đè trong phiên).
              </p>
            )}
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontFamily: 'monospace'
                }}
              />
              {geminiApiKey && (
                <button
                  type="button"
                  onClick={() => handleSaveApiKey('')}
                  style={{
                    padding: '6px 10px',
                    background: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Xóa
                </button>
              )}
              <button
                type="button"
                onClick={() => handleSaveApiKey(geminiApiKey)}
                style={{
                  padding: '6px 12px',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Lưu
              </button>
            </div>
          </div>
        )}

        {/* MESSAGES STREAM */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px',
            backgroundColor: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: m.sender === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  maxWidth: m.sender === 'user' ? '85%' : '95%'
                }}
              >
                {m.sender === 'ai' && (
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: '#2563eb',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}
                  >
                    <Sparkles size={14} color="#fde047" />
                  </div>
                )}

                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: m.sender === 'user' ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
                    backgroundColor: m.sender === 'user' ? '#2563eb' : '#ffffff',
                    color: m.sender === 'user' ? '#ffffff' : '#1e293b',
                    border: m.sender === 'user' ? 'none' : '1px solid #e2e8f0',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                    fontSize: '13px',
                    lineHeight: 1.55,
                    wordBreak: 'break-word'
                  }}
                >
                  {m.sender === 'user' ? (
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{m.text}</p>
                  ) : (
                    <div>{renderFormattedMarkdown(m.text)}</div>
                  )}

                  <div
                    style={{
                      marginTop: '5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '10px',
                      color: m.sender === 'user' ? '#bfdbfe' : '#94a3b8',
                      justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <span>{m.timestamp}</span>
                    {m.mode && (
                      <span
                        style={{
                          padding: '1px 5px',
                          borderRadius: '4px',
                          background: m.sender === 'user' ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
                          color: m.sender === 'user' ? '#ffffff' : '#475569',
                          fontWeight: 600
                        }}
                      >
                        {m.mode === 'GEMINI_LLM' ? 'Gemini Live' : m.mode === 'ERROR' ? 'Lỗi' : 'Smart Engine'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {m.suggestedQuestions && m.suggestedQuestions.length > 0 && (
                <div
                  style={{
                    marginTop: '8px',
                    marginLeft: '36px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px'
                  }}
                >
                  {m.suggestedQuestions.map((q, qIdx) => (
                    <button
                      type="button"
                      key={qIdx}
                      onClick={() => handleSendMessage(q)}
                      disabled={loading}
                      style={{
                        padding: '5px 10px',
                        background: '#ffffff',
                        border: '1px solid #bfdbfe',
                        borderRadius: '14px',
                        color: '#1d4ed8',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        textAlign: 'left'
                      }}
                    >
                      <ChevronRight size={12} />
                      <span>{q}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: '#2563eb',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <RotateCw size={13} style={{ animation: 'spin 1s linear infinite' }} />
              </div>
              <div
                style={{
                  padding: '9px 12px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px 14px 14px 3px',
                  fontSize: '12px',
                  color: '#64748b'
                }}
              >
                Đang phân tích dữ liệu SQL Server...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* INPUT BAR */}
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#ffffff',
            borderTop: '1px solid #e2e8f0'
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Hỏi về tồn kho, hạn dùng, đề xuất nhập hoặc điều phối..."
              disabled={loading}
              style={{
                flex: 1,
                height: '40px',
                padding: '0 12px',
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                fontSize: '13px',
                color: '#0f172a',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              aria-label="Gửi câu hỏi"
              style={{
                width: '40px',
                height: '40px',
                background: loading || !inputMessage.trim() ? '#cbd5e1' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                cursor: loading || !inputMessage.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Send size={15} />
            </button>
          </form>

          <div
            style={{
              marginTop: '7px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: '#94a3b8'
            }}
          >
            <span>Nhấn <strong>Enter</strong> để gửi • <strong>Esc</strong> để đóng</span>
            <button
              type="button"
              onClick={() =>
                setMessages([buildWelcomeMessage({ fullName: currentUser?.fullName, isSingleStore })])
              }
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                padding: '2px 4px'
              }}
            >
              <RefreshCw size={11} />
              Làm mới hội thoại
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
