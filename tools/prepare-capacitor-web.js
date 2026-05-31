const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "www");
const COPY_ENTRIES = [
  "index.html",
  "manifest.webmanifest",
  "service-worker.js",
  "icons",
  "vendor"
];

function copyRecursive(source, target) {
  const stats = fs.statSync(source);
  if (stats.isDirectory()) {
    fs.mkdirSync(target, { recursive: true });
    fs.readdirSync(source).forEach((entry) => {
      copyRecursive(path.join(source, entry), path.join(target, entry));
    });
    return;
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function main() {
  fs.rmSync(OUT_DIR, { force: true, recursive: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  COPY_ENTRIES.forEach((entry) => {
    const source = path.join(ROOT, entry);
    if (!fs.existsSync(source)) {
      throw new Error(`Missing required web asset: ${entry}`);
    }
    copyRecursive(source, path.join(OUT_DIR, entry));
  });

  console.log(`Prepared Capacitor web assets in ${path.relative(ROOT, OUT_DIR)}`);
}

main();
