const fs = require("fs");

function checkInlineScripts() {
  const html = fs.readFileSync("index.html", "utf8");
  const scripts = [...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
  scripts.forEach((code) => new Function(code));
  return scripts.length;
}

function checkJson(file) {
  JSON.parse(fs.readFileSync(file, "utf8"));
}

checkJson("manifest.webmanifest");
const scriptCount = checkInlineScripts();
new Function(fs.readFileSync("service-worker.js", "utf8"));
new Function(fs.readFileSync("sync-server.js", "utf8"));

console.log(JSON.stringify({
  manifest: true,
  inlineScripts: scriptCount,
  serviceWorker: true,
  syncServer: true,
  ok: true
}));
