// backup_database.js
// Script tạo bản sao lưu snapshot .bak cho CSDL retail_spoilage_db trên SQL Server LocalDB

const path = require('path');
const fs = require('fs');
const SqlConnection = require('./src/infrastructure/database/sqlConnection');

async function backupDatabase() {
  const backupDir = path.resolve(__dirname, '..', 'Database', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const backupFile = path.join(backupDir, 'retail_spoilage_db_master_seed.bak');
  const safePath = backupFile.replace(/'/g, "''");

  console.log(`[BACKUP] Bắt đầu sao lưu CSDL vào: ${backupFile}`);
  const sql = `
    BACKUP DATABASE retail_spoilage_db
    TO DISK = N'${safePath}'
    WITH FORMAT, INIT, NAME = N'retail_spoilage_db-MasterSeedBackup', SKIP, NOREWIND, NOUNLOAD, STATS = 10;
  `;
  try {
    const res = await SqlConnection.executeSql(sql);
    console.log(`[BACKUP] Sao lưu CSDL mẫu thành công 100%!`);
    return { success: true, backupFile, output: res };
  } catch (err) {
    console.error(`[BACKUP] Lỗi sao lưu CSDL:`, err.message);
    throw err;
  }
}

if (require.main === module) {
  backupDatabase();
}

module.exports = backupDatabase;
