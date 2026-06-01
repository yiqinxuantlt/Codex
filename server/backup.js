const fs = require("fs");
const path = require("path");

const { BACKUP_DIR, DATA_FILE, MAX_SERVER_BACKUPS } = require("./config");

function formatBackupStamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "-",
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
    "-",
    String(date.getMilliseconds()).padStart(3, "0")
  ].join("");
}

function pruneServerBackups() {
  if (!fs.existsSync(BACKUP_DIR)) {
    return;
  }

  const backups = fs.readdirSync(BACKUP_DIR)
    .filter((name) => /^sync-data-\d{8}-\d{6}-\d{3}\.json$/.test(name))
    .map((name) => ({
      name,
      fullPath: path.join(BACKUP_DIR, name)
    }))
    .sort((a, b) => b.name.localeCompare(a.name));

  backups.slice(MAX_SERVER_BACKUPS).forEach((item) => {
    try {
      fs.unlinkSync(item.fullPath);
    } catch (error) {
      console.warn("Unable to prune old backup:", error.message);
    }
  });
}

function backupExistingDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    return;
  }

  try {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const backupPath = path.join(BACKUP_DIR, `sync-data-${formatBackupStamp()}.json`);
    fs.copyFileSync(DATA_FILE, backupPath);
    pruneServerBackups();
  } catch (error) {
    console.warn("Unable to create sync data backup:", error.message);
  }
}

module.exports = {
  backupExistingDataFile,
  formatBackupStamp,
  pruneServerBackups
};
