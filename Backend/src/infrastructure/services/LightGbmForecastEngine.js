// src/infrastructure/services/LightGbmForecastEngine.js
const path = require('path');
const { spawn } = require('child_process');

const PREDICT_CLI_PATH = path.join(__dirname, '../../../ai_engine/predict_cli.py');
const CACHE_TTL_MS = 15000;
const MAX_CACHE_ENTRIES = 30;
const inferenceCache = new Map();

function spawnInference(pythonBin, payload) {
  return new Promise((resolve, reject) => {
    const child = spawn(pythonBin, [PREDICT_CLI_PATH], { windowsHide: true });
    let stdout = '';
    let stderr = '';
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        try { child.kill(); } catch {}
        reject(new Error('LightGBM inference timeout (> 15000ms)'));
      }
    }, 15000);

    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('error', (err) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(err);
      }
    });
    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code !== 0) {
        return reject(new Error(stderr || `predict_cli exited with code ${code}`));
      }
      try {
        const parsed = JSON.parse(stdout.trim());
        resolve(parsed);
      } catch (parseErr) {
        reject(new Error(`Lỗi JSON từ LightGBM CLI: ${parseErr.message}`));
      }
    });

    child.stdin.write(JSON.stringify({ rows: payload }));
    child.stdin.end();
  });
}

/**
 * Chạy suy luận hàng loạt mô hình pretrained_lgbm_model.pkl cho khung 7 ngày tới.
 * Trả về Map<rowKey, predictedDailyDemand> hoặc null nếu Python không khả dụng.
 */
async function predict7DayBatch(featureRows = [], cacheKey = '') {
  if (!Array.isArray(featureRows) || featureRows.length === 0) {
    return new Map();
  }

  if (cacheKey) {
    const cached = inferenceCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return cached.map;
    }
  }

  const binaries = process.platform === 'win32' ? ['python', 'py'] : ['python3', 'python'];
  let result = null;
  for (const bin of binaries) {
    try {
      result = await spawnInference(bin, featureRows);
      if (result && result.success && Array.isArray(result.testPredictions)) {
        break;
      }
    } catch {
      result = null;
    }
  }

  if (!result || !result.success || !Array.isArray(result.testPredictions)) {
    return null;
  }

  const outMap = new Map();
  for (const item of result.testPredictions) {
    if (item && item.rowKey !== undefined && item.rowKey !== null) {
      outMap.set(String(item.rowKey), Number(item.predictedDailyDemand || 0));
    }
  }

  if (cacheKey) {
    if (inferenceCache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = inferenceCache.keys().next().value;
      if (oldestKey) inferenceCache.delete(oldestKey);
    }
    inferenceCache.set(cacheKey, { ts: Date.now(), map: outMap });
  }

  return outMap;
}

function clearCache() {
  inferenceCache.clear();
}

module.exports = {
  predict7DayBatch,
  clearCache
};
