// src/infrastructure/database/sqlConnection.js
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile, spawn } = require('child_process');

const READ_CACHE_TTL_MS = 3000;
const MAX_WORKERS = 4;
const WORKER_SCRIPT = path.join(__dirname, '..', '..', '..', 'sql_worker.ps1');

const readCache = new Map();
const inFlightReads = new Map();

let preferPowerShell = false;
let disableWorkerPool = false;
let workerConsecutiveFailures = 0;
let nextReqId = 1;

const workers = [];
const jobQueue = [];

function unrefWorker(worker) {
  if (!worker || !worker.child) return;
  try { worker.child.unref(); } catch {}
  try { worker.child.stdin?.unref?.(); } catch {}
  try { worker.child.stdout?.unref?.(); } catch {}
  try { worker.child.stderr?.unref?.(); } catch {}
}

function refWorker(worker) {
  if (!worker || !worker.child) return;
  try { worker.child.ref(); } catch {}
  try { worker.child.stdin?.ref?.(); } catch {}
  try { worker.child.stdout?.ref?.(); } catch {}
  try { worker.child.stderr?.ref?.(); } catch {}
}

function terminateAllWorkers() {
  while (workers.length > 0) {
    const w = workers.pop();
    try {
      if (w.child && !w.child.killed) {
        w.child.kill();
      }
    } catch {}
  }
}

process.once('exit', terminateAllWorkers);

function removeWorker(worker) {
  const idx = workers.indexOf(worker);
  if (idx !== -1) workers.splice(idx, 1);
  if (worker.currentJob) {
    const job = worker.currentJob;
    worker.currentJob = null;
    job.reject(new Error('SQL_WORKER_EXITED'));
  }
}

function spawnSqlWorker() {
  const child = spawn(
    'powershell',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', WORKER_SCRIPT],
    { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true }
  );

  const worker = {
    child,
    ready: false,
    busy: false,
    buffer: '',
    currentJob: null
  };

  let readyResolve;
  let readyReject;
  const readyPromise = new Promise((res, rej) => {
    readyResolve = res;
    readyReject = rej;
  });

  const handleStdout = (chunk) => {
    worker.buffer += chunk.toString('utf8');
    let nlIdx;
    while ((nlIdx = worker.buffer.indexOf('\n')) !== -1) {
      const line = worker.buffer.slice(0, nlIdx).trim();
      worker.buffer = worker.buffer.slice(nlIdx + 1);
      if (!line) continue;

      let msg;
      try {
        msg = JSON.parse(line);
      } catch {
        continue;
      }

      if (msg.ready) {
        worker.ready = true;
        workerConsecutiveFailures = 0;
        readyResolve(worker);
        dispatchNextJob();
        continue;
      }

      if (!worker.ready && msg.id === 0 && msg.ok === false) {
        const errText = msg.errB64 ? Buffer.from(msg.errB64, 'base64').toString('utf8') : 'Worker init error';
        readyReject(new Error(errText));
        continue;
      }

      const job = worker.currentJob;
      if (job && Number(msg.id) === job.id) {
        worker.currentJob = null;
        worker.busy = false;
        unrefWorker(worker);

        if (msg.ok) {
          const outText = msg.outB64 ? Buffer.from(msg.outB64, 'base64').toString('utf8') : '';
          job.resolve(outText);
        } else {
          const errText = msg.errB64 ? Buffer.from(msg.errB64, 'base64').toString('utf8') : 'SQL execution failed';
          const sqlErr = new Error(errText);
          job.reject(sqlErr);
        }
        dispatchNextJob();
      }
    }
  };

  child.stdout.on('data', handleStdout);
  child.stderr.on('data', () => {});

  child.on('error', (err) => {
    removeWorker(worker);
    if (!worker.ready) readyReject(err);
    dispatchNextJob();
  });

  child.on('close', () => {
    removeWorker(worker);
    if (!worker.ready) readyReject(new Error('SQL_WORKER_CLOSED_BEFORE_READY'));
    dispatchNextJob();
  });

  workers.push(worker);
  return readyPromise;
}

function dispatchNextJob() {
  if (jobQueue.length === 0) return;

  const idleWorker = workers.find(w => w.ready && !w.busy);
  if (idleWorker) {
    const job = jobQueue.shift();
    idleWorker.busy = true;
    idleWorker.currentJob = job;
    refWorker(idleWorker);
    const payload = JSON.stringify({
      id: job.id,
      sqlB64: Buffer.from('SET NOCOUNT ON;\n' + job.sql, 'utf8').toString('base64')
    });
    try {
      idleWorker.child.stdin.write(payload + '\n');
    } catch (writeErr) {
      idleWorker.busy = false;
      idleWorker.currentJob = null;
      unrefWorker(idleWorker);
      removeWorker(idleWorker);
      job.reject(writeErr);
    }
    return;
  }

  if (workers.length < MAX_WORKERS) {
    spawnSqlWorker().catch(() => {
      workerConsecutiveFailures += 1;
      if (workerConsecutiveFailures >= 3) {
        disableWorkerPool = true;
        while (jobQueue.length > 0) {
          const pending = jobQueue.shift();
          pending.reject(new Error('SQL_WORKER_UNAVAILABLE'));
        }
      }
    });
  }
}

function executeViaWorkerPool(normalizedSql) {
  if (disableWorkerPool || !fs.existsSync(WORKER_SCRIPT)) {
    return Promise.reject(new Error('SQL_WORKER_UNAVAILABLE'));
  }

  return new Promise((resolve, reject) => {
    const id = nextReqId++;
    jobQueue.push({ id, sql: normalizedSql, resolve, reject });
    dispatchNextJob();
  });
}

function executeViaFallback(normalizedSql) {
  return new Promise((resolve, reject) => {
    const tempDir = path.join(os.tmpdir(), 'spoilage_sql_tmp');
    if (!fs.existsSync(tempDir)) {
      try { fs.mkdirSync(tempDir, { recursive: true }); } catch {}
    }
    const uniqueId = `qry_${process.pid}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const tempFile = path.join(tempDir, `${uniqueId}.sql`);
    const outFile = path.join(tempDir, `${uniqueId}.out`);
    fs.writeFileSync(tempFile, '\uFEFFSET NOCOUNT ON;\n' + normalizedSql, 'utf8');

    const runWithPs = () => {
      const runnerScript = path.join(__dirname, '..', '..', '..', 'sql_runner.ps1');
      execFile(
        'powershell',
        ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', runnerScript, tempFile],
        { encoding: 'utf8', maxBuffer: 30 * 1024 * 1024, windowsHide: true },
        (error, stdout, stderr) => {
          try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); } catch {}
          try { if (fs.existsSync(outFile)) fs.unlinkSync(outFile); } catch {}
          if (error) {
            const errMsg = (stderr && stderr.trim()) || (stdout && stdout.trim()) || error.message;
            const sqlErr = new Error(errMsg);
            sqlErr.code = error.code;
            return reject(sqlErr);
          }
          resolve(stdout);
        }
      );
    };

    if (preferPowerShell) {
      runWithPs();
    } else {
      const args = [
        '-b',
        '-f', '65001',
        '-y', '0',
        '-S', '(localdb)\\mssqllocaldb',
        '-d', 'retail_spoilage_db',
        '-i', tempFile,
        '-o', outFile
      ];

      execFile(
        'sqlcmd',
        args,
        { encoding: 'utf8', maxBuffer: 30 * 1024 * 1024, windowsHide: true },
        (error, stdout, stderr) => {
          let outputContent = '';
          if (fs.existsSync(outFile)) {
            try {
              outputContent = fs.readFileSync(outFile, 'utf8').replace(/^\uFEFF/, '');
              fs.unlinkSync(outFile);
            } catch {}
          }

          if (error) {
            const errMsg = (outputContent && outputContent.trim()) || (stdout && stdout.trim()) || (stderr && stderr.trim()) || error.message;
            if (process.platform === 'win32' && (errMsg.includes('ODBC') || errMsg.includes('Data source') || errMsg.includes('error: 52'))) {
              preferPowerShell = true;
              return runWithPs();
            }
            try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); } catch {}
            const sqlErr = new Error(errMsg);
            sqlErr.code = error.code;
            return reject(sqlErr);
          }
          try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); } catch {}
          if (outputContent && outputContent.includes('Msg ') && /Level (1[1-9]|2[0-9])/i.test(outputContent)) {
            return reject(new Error(outputContent.trim()));
          }
          resolve(outputContent);
        }
      );
    }
  });
}

class SqlConnection {
  static isWriteQuery(query) {
    if (!query) return false;
    return /\b(INSERT|UPDATE|DELETE|MERGE|EXEC|EXECUTE|CREATE|ALTER|DROP|TRUNCATE)\b/i.test(query) ||
      /\bBEGIN\s+(TRANSACTION|TRAN|TRY)\b/i.test(query);
  }

  static clearCache() {
    readCache.clear();
  }

  static executeSql(query) {
    const normalizedSql = String(query || '').trim();
    const isWrite = this.isWriteQuery(normalizedSql);

    if (isWrite) {
      this.clearCache();
    } else {
      const cached = readCache.get(normalizedSql);
      if (cached && (Date.now() - cached.timestamp) < READ_CACHE_TTL_MS) {
        return Promise.resolve(cached.data);
      }
      if (inFlightReads.has(normalizedSql)) {
        return inFlightReads.get(normalizedSql);
      }
    }

    const promise = executeViaWorkerPool(normalizedSql)
      .catch((workerErr) => {
        if (
          workerErr.message === 'SQL_WORKER_UNAVAILABLE' ||
          workerErr.message === 'SQL_WORKER_EXITED' ||
          workerErr.message === 'SQL_WORKER_CLOSED_BEFORE_READY'
        ) {
          return executeViaFallback(normalizedSql);
        }
        throw workerErr;
      })
      .then((stdout) => {
        if (isWrite) {
          this.clearCache();
        } else {
          if (readCache.size > 200) {
            const oldestKey = readCache.keys().next().value;
            if (oldestKey) readCache.delete(oldestKey);
          }
          readCache.set(normalizedSql, { data: stdout, timestamp: Date.now() });
        }
        return stdout;
      })
      .finally(() => {
        if (!isWrite) {
          inFlightReads.delete(normalizedSql);
        }
      });

    if (!isWrite) {
      inFlightReads.set(normalizedSql, promise);
    }

    return promise;
  }

  static async queryJson(query) {
    const cleanQuery = String(query || '').trim().replace(/;+$/, '');
    const hasForJsonAtEnd = /FOR\s+JSON(\s+\w+)*$/i.test(cleanQuery);
    const isBlockScript = /BEGIN\s+(TRY|TRANSACTION)/i.test(cleanQuery);

    let finalQuery;
    if (hasForJsonAtEnd || isBlockScript) {
      finalQuery = cleanQuery;
    } else {
      finalQuery = `${cleanQuery} FOR JSON PATH`;
    }

    const raw = await this.executeSql(finalQuery);
    const lines = raw.split(/\r?\n/).filter(l => !l.startsWith('JSON_') && !l.startsWith('---'));
    const jsonStr = lines.join('').trim();
    if (!jsonStr) return [];
    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      const match = jsonStr.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
      if (match) {
        try {
          return JSON.parse(match[1]);
        } catch (subErr) {}
      }
      return [];
    }
  }

  static escapeSql(val) {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') {
      return Number.isFinite(val) ? val.toString() : '0';
    }
    if (typeof val === 'boolean') return val ? '1' : '0';
    if (val instanceof Date) {
      return Number.isNaN(val.getTime()) ? 'NULL' : `'${val.toISOString()}'`;
    }
    const sanitized = String(val).replace(/\0/g, '').replace(/'/g, "''");
    return `N'${sanitized}'`;
  }

  static formatQuery(sqlTemplate, params = {}) {
    return String(sqlTemplate).replace(/@([a-zA-Z0-9_]+)/g, (match, paramName) => {
      if (Object.prototype.hasOwnProperty.call(params, paramName)) {
        return this.escapeSql(params[paramName]);
      }
      return match;
    });
  }

  static warmUp(count = 2) {
    if (disableWorkerPool || !fs.existsSync(WORKER_SCRIPT)) return Promise.resolve();
    const target = Math.max(1, Math.min(MAX_WORKERS, Number(count) || 2));
    const promises = [];
    while (workers.length < target) {
      promises.push(spawnSqlWorker().catch(() => null));
    }
    return Promise.all(promises);
  }
}

module.exports = SqlConnection;
