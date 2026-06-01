const fs = require("fs");

function checkHtmlReferences() {
  const html = fs.readFileSync("index.html", "utf8");
  const required = [
    "./src/styles.css",
    "./src/tailwind-config.js",
    "./src/app.js"
  ];
  required.forEach((reference) => {
    if (!html.includes(reference)) {
      throw new Error(`Missing frontend reference: ${reference}`);
    }
  });
  return required.length;
}

function checkJson(file) {
  JSON.parse(fs.readFileSync(file, "utf8"));
}

function checkScript(file) {
  new Function(fs.readFileSync(file, "utf8"));
}

checkJson("manifest.webmanifest");
const frontendReferences = checkHtmlReferences();
checkScript("src/tailwind-config.js");
checkScript("src/app.js");
checkScript("service-worker.js");
checkScript("sync-server.js");
fs.readdirSync("server")
  .filter((file) => file.endsWith(".js"))
  .forEach((file) => checkScript(`server/${file}`));

console.log(JSON.stringify({
  manifest: true,
  frontendReferences,
  serviceWorker: true,
  syncServer: true,
  serverEntry: true,
  ok: true
}));
