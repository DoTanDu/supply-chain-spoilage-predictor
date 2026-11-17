import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Sparkles, 
  X, 
  Send, 
  RefreshCw, 
  Key, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCw, 
  ChevronRight,
  Minimize2,
  Maximize2,
  HelpCircle,
  TrendingUp,
  PackageX,
  Truck
} from 'lucide-react';
import { askAiAssistant } from '../api';

export default function AiAssistantModal({ 
  isOpen, 
  onClose, 
  currentUser,
  currentRole 
}) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: `### 👋 Xin chào ${currentUser?.fullName || 'Quản lý'}! Tôi là Trợ lý AI 4 (SmartSupply AI Assistant).

Tôi đóng vai trò **Bộ não giải thích & hỗ trợ quyết định** cho chuỗi cửa hàng LHU Mart, kết nối trực tiếp với 3 mô hình chuyên biệt:
- 📈 **AI 1 - Demand Forecasting:** Dự báo nhu cầu 7 ngày (Mô hình LightGBM - MAE 1.508).
- ⚠️ **AI 2 - Spoilage Risk:** Đánh giá rủi ro cận date & phân tích tồn kho quá hạn (DOS > DUE).
- 🔄 **AI 3 - Inventory Optimization:** Bộ giải tối ưu điều phối cân bằng cung - cầu 3 chi nhánh (Google OR-Tools).

Bạn có thể bấm vào các câu hỏi gợi ý bên dưới hoặc hỏi bất kỳ thông tin nào về hạn dùng, đề xuất nhập hoặc điều phối hàng hóa nhé!`,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      mode: 'SYSTEM',
      suggestedQuestions: [
        'Tại sao hôm nay hệ thống đề xuất giảm nhập bánh sandwich?',
        'Những mặt hàng nào có nguy cơ hủy cao nhất trong 3 ngày tới?',
        'Tình hình điều phối liên cửa hàng OR-Tools hiện tại thế nào?',
        'Báo cáo tổng kết hiệu quả chống lãng phí hôm nay'
      ]
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [activeEngineMode, setActiveEngineMode] = useState('LOCAL_INTELLIGENCE_ENGINE');
  const [isExpanded, setIsExpanded] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSaveApiKey = (key) => {
    setGeminiApiKey(key);
    if (key.trim()) {
      localStorage.setItem('gemini_api_key', key.trim());
    } else {
      localStorage.removeItem('gemini_api_key');
    }
    setShowKeyConfig(false);
  };

  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || loading) return;

    const userMsg = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInputMessage('');
    setLoading(true);

    try {
      const res = await askAiAssistant(textToSend.trim(), geminiApiKey, currentRole);
      if (res && res.reply) {
        setActiveEngineMode(res.mode || 'LOCAL_INTELLIGENCE_ENGINE');
        const aiMsg = {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text: res.reply,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          mode: res.mode,
          model: res.model,
          suggestedQuestions: res.suggestedQuestions || []
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        throw new Error(res.message || 'Không nhận được phản hồi từ AI Assistant');
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'ai',
          text: `⚠️ **Đã xảy ra lỗi:** ${err.message}. Hệ thống đang tự động điều hướng sang bộ máy suy luận quy tắc nội bộ.`,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          mode: 'ERROR'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatBold = (str) => {
    const parts = str.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ fontWeight: 700, color: '#0f172a' }}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} style={{
            padding: '1px 5px',
            margin: '0 3px',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '4px',
            fontSize: '11px',
            fontFamily: 'Consolas, monospace',
            color: '#1d4ed8',
            fontWeight: 600
          }}>
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
          <div key={idx} style={{
            fontSize: '14px',
            fontWeight: 800,
            color: '#1e3a8a',
            margin: '8px 0 6px 0',
            paddingBottom: '4px',
            borderBottom: '1px dashed #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
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
          <div key={idx} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            fontSize: '13px',
            color: '#334155',
            lineHeight: 1.6,
            margin: '4px 0 4px 6px'
          }}>
            <span style={{ color: '#2563eb', fontWeight: 'bold', minWidth: '8px' }}>•</span>
            <span style={{ flex: 1 }}>{formatBold(content)}</span>
          </div>
        );
      }
      if (/^\d+\.\s+/.test(line.trim())) {
        const num = line.trim().match(/^(\d+)\.\s+/)[1];
        const content = line.trim().replace(/^\d+\.\s+/, '');
        return (
          <div key={idx} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            fontSize: '13px',
            color: '#334155',
            lineHeight: 1.6,
            margin: '5px 0'
          }}>
            <span style={{
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
            }}>
              {num}
            </span>
            <span style={{ flex: 1 }}>{formatBold(content)}</span>
          </div>
        );
      }
      if (!line.trim()) {
        return <div key={idx} style={{ height: '6px' }} />;
      }
      return (
        <p key={idx} style={{ fontSize: '13px', color: '#334155', lineHeight: 1.6, margin: '4px 0' }}>
          {formatBold(line)}
        </p>
      );
    });
  };

  if (!isOpen) return null;

  return (
    <div style={{
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
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        width: isExpanded ? '720px' : '480px',
        height: isExpanded ? '85vh' : '650px',
        maxHeight: '90vh',
        maxWidth: '100%',
        borderRadius: '16px',
        boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.3), 0 0 0 1px rgba(15, 23, 42, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 0.25s ease, height 0.25s ease',
        fontFamily: 'inherit'
      }}>
        {/* HEADER */}
        <div style={{
          padding: '14px 18px',
          background: 'linear-gradient(135deg, #1d4ed8 0%, #4338ca 60%, #3b82f6 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
          userSelect: 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2)'
            }}>
              <Bot size={20} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 800, fontSize: '14px', letterSpacing: '0.02em' }}>
                  Trợ lý AI 4 (SmartSupply AI)
                </span>
                <span style={{
                  padding: '2px 7px',
                  borderRadius: '10px',
                  fontSize: '9px',
                  fontWeight: 800,
                  background: '#10b981',
                  color: '#ffffff',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em'
                }}>
                  Live
                </span>
              </div>
              <div style={{
                fontSize: '11px',
                color: '#dbeafe',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                marginTop: '1px'
              }}>
                <Sparkles size={11} color="#fde047" />
                <span>Giải thích Báo cáo & Hỗ trợ Ra quyết định</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              title="Cấu hình Google Gemini API Key"
              style={{
                background: geminiApiKey ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
                border: 'none',
                color: geminiApiKey ? '#fde047' : '#ffffff',
                padding: '6px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Key size={15} />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Thu nhỏ' : 'Mở rộng'}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                padding: '6px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
            <button
              onClick={onClose}
              title="Đóng trợ lý"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                padding: '6px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* STATUS SUB-BAR */}
        <div style={{
          padding: '7px 16px',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: '#475569'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)'
            }} />
            <span>Chế độ:</span>
            <strong style={{ color: '#0f172a' }}>
              {geminiApiKey ? 'Gemini 2.5/3.8 Flash (LLM Live)' : 'SmartSupply Local Engine (Offline-Ready)'}
            </strong>
          </div>
          <span style={{
            fontSize: '10px',
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: '12px',
            backgroundColor: '#e2e8f0',
            color: '#334155'
          }}>
            4-Tier Clean Architecture
          </span>
        </div>

        {/* API KEY CONFIG PANEL */}
        {showKeyConfig && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#fffbeb',
            borderBottom: '1px solid #fde68a',
            fontSize: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontWeight: 700, color: '#92400e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Key size={13} color="#d97706" />
                Cấu hình Google Gemini API Key (Tùy chọn)
              </span>
              <button onClick={() => setShowKeyConfig(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400e' }}>
                <X size={13} />
              </button>
            </div>
            <p style={{ margin: '0 0 8px 0', color: '#78350f', fontSize: '11px', lineHeight: 1.5 }}>
              Dán Google Gemini API Key để kết nối LLM trực tiếp. Nếu để trống, hệ thống sử dụng <strong>SmartSupply Rule & Knowledge Engine</strong> nội bộ không cần Internet.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
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
              <button
                onClick={() => handleSaveApiKey(geminiApiKey)}
                style={{
                  padding: '6px 14px',
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
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          backgroundColor: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: m.sender === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                maxWidth: m.sender === 'user' ? '85%' : '94%'
              }}>
                {m.sender === 'ai' && (
                  <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    background: '#2563eb',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                    boxShadow: '0 2px 4px rgba(37, 99, 235, 0.25)'
                  }}>
                    <Sparkles size={15} color="#fde047" />
                  </div>
                )}

                <div style={{
                  padding: '12px 16px',
                  borderRadius: m.sender === 'user' ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
                  backgroundColor: m.sender === 'user' ? '#2563eb' : '#ffffff',
                  color: m.sender === 'user' ? '#ffffff' : '#1e293b',
                  border: m.sender === 'user' ? 'none' : '1px solid #e2e8f0',
                  boxShadow: m.sender === 'user' ? '0 2px 8px rgba(37, 99, 235, 0.25)' : '0 1px 3px rgba(0, 0, 0, 0.05)',
                  fontSize: '13px',
                  lineHeight: 1.6,
                  wordBreak: 'break-word'
                }}>
                  {m.sender === 'user' ? (
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{m.text}</p>
                  ) : (
                    <div>{renderFormattedMarkdown(m.text)}</div>
                  )}

                  <div style={{
                    marginTop: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '10px',
                    color: m.sender === 'user' ? '#bfdbfe' : '#94a3b8',
                    justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start'
                  }}>
                    <span>{m.timestamp}</span>
                    {m.mode && (
                      <span style={{
                        padding: '1px 5px',
                        borderRadius: '4px',
                        background: m.sender === 'user' ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
                        color: m.sender === 'user' ? '#ffffff' : '#475569',
                        fontWeight: 600
                      }}>
                        {m.mode === 'GEMINI_LLM' ? 'Gemini Live' : 'Smart Engine'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* QUICK SUGGESTIONS UNDER AI BUBBLE */}
              {m.suggestedQuestions && m.suggestedQuestions.length > 0 && (
                <div style={{
                  marginTop: '10px',
                  marginLeft: '38px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px'
                }}>
                  {m.suggestedQuestions.map((q, qIdx) => (
                    <button
                      key={qIdx}
                      onClick={() => handleSendMessage(q)}
                      disabled={loading}
                      style={{
                        padding: '6px 12px',
                        background: '#ffffff',
                        border: '1px solid #bfdbfe',
                        borderRadius: '16px',
                        color: '#1d4ed8',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 1px 2px rgba(37, 99, 235, 0.06)',
                        transition: 'all 0.15s ease',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#eff6ff';
                        e.currentTarget.style.borderColor = '#3b82f6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#ffffff';
                        e.currentTarget.style.borderColor = '#bfdbfe';
                      }}
                    >
                      <ChevronRight size={13} color="#2563eb" style={{ flexShrink: 0 }} />
                      <span>{q}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: '#2563eb',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <RotateCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
              </div>
              <div style={{
                padding: '10px 14px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '14px 14px 14px 3px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                fontSize: '12px',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#2563eb'
                }} />
                <span>Trợ lý AI đang phân tích dữ liệu kho & đối soát mô hình...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* INPUT BAR */}
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#ffffff',
          borderTop: '1px solid #e2e8f0'
        }}>
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
              placeholder="Hỏi về lý do giảm nhập, nguy cơ quá hạn 3 ngày tới, điều phối OR-Tools..."
              disabled={loading}
              style={{
                flex: 1,
                height: '42px',
                padding: '0 14px',
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                fontSize: '13px',
                color: '#0f172a',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#2563eb';
                e.target.style.backgroundColor = '#ffffff';
                e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#cbd5e1';
                e.target.style.backgroundColor = '#f8fafc';
                e.target.style.boxShadow = 'none';
              }}
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              style={{
                width: '42px',
                height: '42px',
                background: loading || !inputMessage.trim() ? '#cbd5e1' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                cursor: loading || !inputMessage.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: loading || !inputMessage.trim() ? 'none' : '0 2px 6px rgba(37, 99, 235, 0.3)',
                transition: 'all 0.15s ease'
              }}
            >
              <Send size={16} />
            </button>
          </form>

          <div style={{
            marginTop: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#94a3b8',
            padding: '0 2px'
          }}>
            <span>Nhấn <strong>Enter</strong> để gửi câu hỏi</span>
            <button
              type="button"
              onClick={() => setMessages(prev => [prev[0]])}
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
