const fs = require("fs");
const path = require("path");

const { DATA_FILE, SCHEMA_VERSION } = require("./config");
const { backupExistingDataFile } = require("./backup");

function nowIso() {
  return new Date().toISOString();
}

function emptyState() {
  const createdAt = nowIso();
  return {
    schemaVersion: SCHEMA_VERSION,
    updatedAt: createdAt,
    notes: [],
    settings: {},
    fonts: [],
    readingEvents: [],
    meta: {
      createdAt,
      lastWriteSource: "server"
    }
  };
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeState(input) {
  const base = emptyState();
  const source = input && typeof input === "object" ? input : {};
  return {
    schemaVersion: SCHEMA_VERSION,
    updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : base.updatedAt,
    notes: asArray(source.notes),
    settings: source.settings && typeof source.settings === "object" ? source.settings : {},
    fonts: asArray(source.fonts),
    readingEvents: asArray(source.readingEvents),
    meta: {
      ...base.meta,
      ...(source.meta && typeof source.meta === "object" ? source.meta : {})
    }
  };
}

function loadState() {
  if (!fs.existsSync(DATA_FILE)) {
    const state = emptyState();
    saveState(state, "server-init");
    return state;
  }

  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return normalizeState(JSON.parse(raw));
  } catch (error) {
    const brokenPath = `${DATA_FILE}.broken-${Date.now()}`;
    try {
      fs.renameSync(DATA_FILE, brokenPath);
    } catch (renameError) {
      console.warn("Unable to preserve broken data file:", renameError.message);
    }
    const state = emptyState();
    state.meta.recoveredFromBrokenFile = path.basename(brokenPath);
    saveState(state, "server-recovery");
    return state;
  }
}

function saveState(nextState, source = "api") {
  const state = normalizeState(nextState);
  state.updatedAt = nowIso();
  state.meta.lastWriteSource = source;
  const tempFile = `${DATA_FILE}.tmp`;
  backupExistingDataFile();
  fs.writeFileSync(tempFile, JSON.stringify(state, null, 2), "utf8");
  fs.renameSync(tempFile, DATA_FILE);
  return state;
}

function mergeById(existing, incoming) {
  const map = new Map();
  asArray(existing).forEach((item) => {
    if (item && item.id) {
      map.set(item.id, item);
    }
  });
  asArray(incoming).forEach((item) => {
    if (!item || !item.id) {
      return;
    }
    const current = map.get(item.id);
    const incomingTime = String(item.updatedAt || item.createdAt || "");
    const currentTime = String((current && (current.updatedAt || current.createdAt)) || "");
    if (!current || incomingTime >= currentTime) {
      map.set(item.id, item);
    }
  });
  return Array.from(map.values());
}

module.exports = {
  asArray,
  emptyState,
  loadState,
  mergeById,
  normalizeState,
  nowIso,
  saveState
};
