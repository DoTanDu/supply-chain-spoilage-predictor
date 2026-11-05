// src/infrastructure/database/sqlConnection.js
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');

const READ_CACHE_TTL_MS = 1500;
const readCache = new Map();
const inFlightReads = new Map();

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

    const promise = new Promise((resolve, reject) => {
      const tempDir = path.join(os.tmpdir(), 'spoilage_sql_tmp');
      if (!fs.existsSync(tempDir)) {
        try { fs.mkdirSync(tempDir, { recursive: true }); } catch (e) {}
      }
      const tempFile = path.join(
        tempDir,
        `qry_${process.pid}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.sql`
      );
      fs.writeFileSync(tempFile, '\uFEFFSET NOCOUNT ON;\n' + normalizedSql, 'utf8');

      const args = [
        '-b',
        '-f', '65001',
        '-y', '0',
        '-S', '(localdb)\\mssqllocaldb',
        '-d', 'retail_spoilage_db',
        '-i', tempFile
      ];

      execFile('sqlcmd', args, { encoding: 'utf8', maxBuffer: 30 * 1024 * 1024, windowsHide: true }, (error, stdout, stderr) => {
        try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); } catch (e) {}
        if (error) {
          const errMsg = (stdout && stdout.trim()) || (stderr && stderr.trim()) || error.message;
          const sqlErr = new Error(errMsg);
          sqlErr.code = error.code;
          return reject(sqlErr);
        }
        if (stdout && stdout.includes('Msg ') && /Level (1[1-9]|2[0-9])/i.test(stdout)) {
          return reject(new Error(stdout.trim()));
        }
        if (isWrite) {
          this.clearCache();
        } else {
          if (readCache.size > 200) {
            const oldestKey = readCache.keys().next().value;
            if (oldestKey) readCache.delete(oldestKey);
          }
          readCache.set(normalizedSql, { data: stdout, timestamp: Date.now() });
        }
        resolve(stdout);
      });
    }).finally(() => {
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
}

module.exports = SqlConnection;
