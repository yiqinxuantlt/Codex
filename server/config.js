const path = require("path");

const PORT = Number(process.env.PORT || 8787);
const ROOT = path.resolve(__dirname, "..");
const INDEX_FILE = path.join(ROOT, "index.html");
const DATA_FILE = path.join(ROOT, process.env.SYNC_DATA_FILE || "sync-data.json");
const BACKUP_DIR = path.join(ROOT, process.env.SYNC_BACKUP_DIR || "backups");
const MAX_BODY_BYTES = 32 * 1024 * 1024;
const SCHEMA_VERSION = 1;
const MAX_SERVER_BACKUPS = 10;

module.exports = {
  BACKUP_DIR,
  DATA_FILE,
  INDEX_FILE,
  MAX_BODY_BYTES,
  MAX_SERVER_BACKUPS,
  PORT,
  ROOT,
  SCHEMA_VERSION
};
