// src/presentation/middlewares/corsConfig.js
/**
 * Cấu hình CORS theo danh sách origin được phép (thay cho cors() cho phép mọi origin).
 * - Biến CORS_ORIGINS: danh sách origin phân tách bằng dấu phẩy, ví dụ "https://app.example.com,https://admin.example.com".
 * - Không đặt CORS_ORIGINS: ngoài production cho phép localhost/127.0.0.1 cổng 5173 (Vite dev) và 4173 (Vite preview);
 *   production thì không cho origin trình duyệt nào khác (chỉ request không có header Origin).
 * - Request không có header Origin (curl, script test, server-to-server) luôn được xử lý bình thường.
 */
const DEV_DEFAULT_ORIGINS = Object.freeze([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173'
]);

function parseOrigins(raw) {
  return String(raw || '')
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

function resolveAllowedOrigins() {
  const configured = parseOrigins(process.env.CORS_ORIGINS);
  if (configured.length > 0) return configured;
  const isProduction = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
  return isProduction ? [] : [...DEV_DEFAULT_ORIGINS];
}

function buildCorsOptions() {
  const allowedOrigins = resolveAllowedOrigins();
  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600
  };
}

module.exports = { buildCorsOptions, resolveAllowedOrigins, DEV_DEFAULT_ORIGINS };

