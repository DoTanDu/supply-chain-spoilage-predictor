import React from 'react';
import { AlertTriangle, RefreshCw, Home, LogOut } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoDashboard = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/dashboard';
  };

  handleClearSession = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (e) {}
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      const isFull = this.props.fullPage;
      return (
        <div style={{
          minHeight: isFull ? '100vh' : '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px',
          textAlign: 'center',
          background: isFull ? 'var(--bg-primary, #f8fafc)' : 'transparent',
          color: 'var(--text-main, #0f172a)'
        }}>
          <div style={{
            background: 'var(--bg-surface, #ffffff)',
            border: '1px solid #fecdd3',
            borderRadius: '16px',
            padding: '36px 40px',
            maxWidth: '620px',
            boxShadow: '0 20px 40px rgba(15, 23, 42, 0.12)'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: '#fff1f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              color: '#e11d48'
            }}>
              <AlertTriangle size={32} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main, #0f172a)' }}>
              Đã phát hiện sự cố hiển thị giao diện
            </h3>
            
            <p style={{ color: 'var(--text-muted, #475569)', fontSize: '0.9rem', marginBottom: '20px', lineHeight: 1.5 }}>
              Hệ thống đã tự động chặn lỗi và bảo vệ phiên làm việc của bạn. Bạn có thể tải lại trang, quay về Tổng quan điều hành hoặc làm mới phiên đăng nhập.
            </p>

            {this.state.error && (
              <div style={{
                background: '#fff1f2',
                border: '1px solid #fda4af',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                color: '#be123c',
                fontFamily: 'monospace',
                marginBottom: '24px',
                textAlign: 'left',
                overflowX: 'auto',
                maxHeight: '120px'
              }}>
                {this.state.error.toString()}
              </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--safe-green, #059669)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem'
                }}
              >
                <RefreshCw size={16} /> Tải lại trang (F5)
              </button>

              <button
                type="button"
                onClick={this.handleGoDashboard}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--bg-subtle, #f1f5f9)',
                  color: 'var(--text-main, #0f172a)',
                  border: '1px solid var(--border-subtle, #cbd5e1)',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem'
                }}
              >
                <Home size={16} /> Về Tổng quan
              </button>

              <button
                type="button"
                onClick={this.handleClearSession}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem'
                }}
              >
                <LogOut size={16} /> Làm mới phiên đăng nhập
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
