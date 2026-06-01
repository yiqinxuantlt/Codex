const http = require("http");

const { BACKUP_DIR, PORT } = require("./config");
const { sendJson, sendText } = require("./http");
const { getLanAddresses } = require("./network");
const { handleApi } = require("./routes");
const { STATIC_ROUTES, sendStaticFile } = require("./static");

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

function startServer() {
  return http.createServer(handleRequest).listen(PORT, "0.0.0.0", () => {
    console.log("Reading review LAN sync is running.");
    console.log(`Desktop: http://localhost:${PORT}/`);
    getLanAddresses().forEach((address) => {
      console.log(`Mobile:  http://${address}:${PORT}/`);
    });
    console.log(`Backups: ${BACKUP_DIR}`);
    console.log("Use only on trusted Wi-Fi. Close this window to stop syncing.");
  });
}

if (require.main === module) {
  startServer();
} else {
  startServer();
}

module.exports = {
  handleRequest,
  startServer
};
