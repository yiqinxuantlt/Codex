const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");

const PORT = Number(process.env.PORT || 8787);
const ROOT = __dirname;
const INDEX_FILE = path.join(ROOT, "index.html");
const DATA_FILE = path.join(ROOT, process.env.SYNC_DATA_FILE || "sync-data.json");
const BACKUP_DIR = path.join(ROOT, process.env.SYNC_BACKUP_DIR || "backups");
const MAX_BODY_BYTES = 32 * 1024 * 1024;
const SCHEMA_VERSION = 1;
const MAX_SERVER_BACKUPS = 10;
const STATIC_ROUTES = new Map([
  ["/", { file: INDEX_FILE, type: "text/html; charset=utf-8", cache: "no-cache" }],
  ["/index.html", { file: INDEX_FILE, type: "text/html; charset=utf-8", cache: "no-cache" }],
  ["/manifest.webmanifest", { file: path.join(ROOT, "manifest.webmanifest"), type: "application/manifest+json; charset=utf-8", cache: "no-cache" }],
  ["/service-worker.js", { file: path.join(ROOT, "service-worker.js"), type: "text/javascript; charset=utf-8", cache: "no-cache" }],
  ["/icons/icon-192.png", { file: path.join(ROOT, "icons", "icon-192.png"), type: "image/png", cache: "public, max-age=604800" }],
  ["/icons/icon-512.png", { file: path.join(ROOT, "icons", "icon-512.png"), type: "image/png", cache: "public, max-age=604800" }],
  ["/icons/maskable-512.png", { file: path.join(ROOT, "icons", "maskable-512.png"), type: "image/png", cache: "public, max-age=604800" }],
  ["/icons/apple-touch-icon.png", { file: path.join(ROOT, "icons", "apple-touch-icon.png"), type: "image/png", cache: "public, max-age=604800" }],
  ["/icons/icon-source.svg", { file: path.join(ROOT, "icons", "icon-source.svg"), type: "image/svg+xml; charset=utf-8", cache: "public, max-age=604800" }],
  ["/vendor/tailwindcss-cdn.js", { file: path.join(ROOT, "vendor", "tailwindcss-cdn.js"), type: "text/javascript; charset=utf-8", cache: "public, max-age=604800" }],
  ["/vendor/papaparse.min.js", { file: path.join(ROOT, "vendor", "papaparse.min.js"), type: "text/javascript; charset=utf-8", cache: "public, max-age=604800" }]
]);

function nowIso() {
  return new Date().toISOString();
}

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

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, text, contentType = "text/plain; charset=utf-8") {
  res.writeHead(statusCode, { "Content-Type": contentType });
  res.end(text);
}

function sendStaticFile(res, route) {
  fs.readFile(route.file, (error, data) => {
    if (error) {
      sendText(res, 404, "Not found");
      return;
    }

    res.writeHead(200, {
      "Content-Type": route.type,
      "Cache-Control": route.cache
    });
    res.end(data);
  });
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    let settled = false;

    req.on("data", (chunk) => {
      if (settled) {
        return;
      }
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        settled = true;
        reject(new Error("REQUEST_TOO_LARGE"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      if (settled) {
        return;
      }
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error("INVALID_JSON"));
      }
    });

    req.on("error", (error) => {
      if (!settled) {
        reject(error);
      }
    });
  });
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

function getLanAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((item) => item && item.family === "IPv4" && !item.internal)
    .map((item) => item.address);
}

async function handleApi(req, res, url) {
  if (req.method === "OPTIONS") {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, {
      ok: true,
      port: PORT,
      addresses: getLanAddresses(),
      updatedAt: loadState().updatedAt
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/state") {
    sendJson(res, 200, { ok: true, state: loadState() });
    return;
  }

  const state = loadState();

  const noteMatch = url.pathname.match(/^\/api\/notes\/([^/]+)$/);
  if (req.method === "DELETE" && noteMatch) {
    const id = decodeURIComponent(noteMatch[1]);
    state.notes = state.notes.filter((note) => note.id !== id);
    sendJson(res, 200, { ok: true, state: saveState(state, "delete-note") });
    return;
  }

  const fontMatch = url.pathname.match(/^\/api\/fonts\/([^/]+)$/);
  if (req.method === "DELETE" && fontMatch) {
    const id = decodeURIComponent(fontMatch[1]);
    state.fonts = state.fonts.filter((font) => font.id !== id);
    sendJson(res, 200, { ok: true, state: saveState(state, "delete-font") });
    return;
  }

  const body = await readJsonBody(req);

  if (req.method === "PUT" && url.pathname === "/api/state") {
    sendJson(res, 200, { ok: true, state: saveState(body.state || body, body.source || "put-state") });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/notes") {
    state.notes = body.replace ? asArray(body.notes) : mergeById(state.notes, body.notes || []);
    sendJson(res, 200, { ok: true, state: saveState(state, body.source || "notes") });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/settings") {
    state.settings = body.settings && typeof body.settings === "object" ? body.settings : {};
    sendJson(res, 200, { ok: true, state: saveState(state, body.source || "settings") });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/fonts") {
    state.fonts = body.replace ? asArray(body.fonts) : mergeById(state.fonts, body.fonts || []);
    sendJson(res, 200, { ok: true, state: saveState(state, body.source || "fonts") });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/reading-events") {
    state.readingEvents = state.readingEvents.concat(asArray(body.readingEvents));
    sendJson(res, 200, { ok: true, state: saveState(state, body.source || "reading-events") });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/clear-notes") {
    state.notes = [];
    sendJson(res, 200, { ok: true, state: saveState(state, body.source || "clear-notes") });
    return;
  }

  sendJson(res, 404, { ok: false, error: "NOT_FOUND" });
}

function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (url.pathname.startsWith("/api/")) {
    handleApi(req, res, url).catch((error) => {
      const code = error.message === "REQUEST_TOO_LARGE" ? 413 : 400;
      sendJson(res, code, { ok: false, error: error.message });
    });
    return;
  }

  if (req.method === "GET" && STATIC_ROUTES.has(url.pathname)) {
    sendStaticFile(res, STATIC_ROUTES.get(url.pathname));
    return;
  }

  sendText(res, 404, "Not found");
}

http.createServer(handleRequest).listen(PORT, "0.0.0.0", () => {
  console.log("Reading review LAN sync is running.");
  console.log(`Desktop: http://localhost:${PORT}/`);
  getLanAddresses().forEach((address) => {
    console.log(`Mobile:  http://${address}:${PORT}/`);
  });
  console.log(`Backups: ${BACKUP_DIR}`);
  console.log("Use only on trusted Wi-Fi. Close this window to stop syncing.");
});
