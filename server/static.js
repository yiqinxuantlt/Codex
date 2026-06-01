const fs = require("fs");
const path = require("path");

const { INDEX_FILE, ROOT } = require("./config");
const { sendText } = require("./http");

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
  ["/vendor/papaparse.min.js", { file: path.join(ROOT, "vendor", "papaparse.min.js"), type: "text/javascript; charset=utf-8", cache: "public, max-age=604800" }],
  ["/src/styles.css", { file: path.join(ROOT, "src", "styles.css"), type: "text/css; charset=utf-8", cache: "no-cache" }],
  ["/src/tailwind-config.js", { file: path.join(ROOT, "src", "tailwind-config.js"), type: "text/javascript; charset=utf-8", cache: "no-cache" }],
  ["/src/app.js", { file: path.join(ROOT, "src", "app.js"), type: "text/javascript; charset=utf-8", cache: "no-cache" }]
]);

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

module.exports = {
  STATIC_ROUTES,
  sendStaticFile
};
