const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const {
  LOCAL_ANDROID_DIR,
  LOCAL_JDK_DIR,
  LOCAL_SDK_DIR,
  ROOT,
  getAndroidEnv,
  getJavaExe,
  getSdkManager
} = require("./android-local");

const DOWNLOAD_DIR = path.join(LOCAL_ANDROID_DIR, "downloads");
const CMDLINE_TOOLS_URL = "https://dl.google.com/android/repository/commandlinetools-win-13114758_latest.zip";
const JDK_URL = "https://api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jdk/hotspot/normal/eclipse";

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function removeDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function copyRecursive(source, target) {
  const stats = fs.statSync(source);
  if (stats.isDirectory()) {
    ensureDir(target);
    fs.readdirSync(source).forEach((entry) => {
      copyRecursive(path.join(source, entry), path.join(target, entry));
    });
    return;
  }

  ensureDir(path.dirname(target));
  fs.copyFileSync(source, target);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: options.input ? ["pipe", "inherit", "inherit"] : "inherit",
    input: options.input,
    env: options.env || getAndroidEnv(),
    shell: Boolean(options.shell)
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed`);
  }
}

async function download(url, target) {
  if (fs.existsSync(target) && fs.statSync(target).size > 1024 * 1024) {
    console.log(`Using cached download: ${path.relative(ROOT, target)}`);
    return;
  }

  console.log(`Downloading ${url}`);
  ensureDir(path.dirname(target));
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }

  const temp = `${target}.tmp`;
  const file = fs.createWriteStream(temp);
  let received = 0;
  const total = Number(response.headers.get("content-length")) || 0;
  let lastPercent = -1;

  for await (const chunk of response.body) {
    received += chunk.length;
    file.write(chunk);
    if (total) {
      const percent = Math.floor((received / total) * 100);
      if (percent !== lastPercent) {
        process.stdout.write(`\r${percent}%`);
        lastPercent = percent;
      }
    }
  }

  await new Promise((resolve) => file.end(resolve));
  if (total) {
    process.stdout.write("\n");
  }
  fs.renameSync(temp, target);
}

function expandZip(zipFile, targetDir) {
  removeDir(targetDir);
  ensureDir(targetDir);
  run("tar.exe", ["-xf", zipFile, "-C", targetDir]);
}

function findFile(startDir, fileName) {
  const stack = [startDir];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.name.toLowerCase() === fileName.toLowerCase()) {
        return full;
      }
    }
  }
  return "";
}

function writeLocalProperties() {
  const escapedSdk = LOCAL_SDK_DIR.replace(/\\/g, "\\\\");
  fs.writeFileSync(path.join(ROOT, "android", "local.properties"), `sdk.dir=${escapedSdk}\n`, "utf8");
}

function hasAcceptedLicenses() {
  return fs.existsSync(path.join(LOCAL_SDK_DIR, "licenses", "android-sdk-license"));
}

async function setupJdk() {
  if (getJavaExe(LOCAL_JDK_DIR)) {
    console.log("Local JDK is ready.");
    return;
  }

  const zipFile = path.join(DOWNLOAD_DIR, "temurin-jdk-21.zip");
  const extractDir = path.join(LOCAL_ANDROID_DIR, "jdk-extract");
  await download(JDK_URL, zipFile);
  expandZip(zipFile, extractDir);

  const javaExe = findFile(extractDir, "java.exe");
  if (!javaExe) {
    throw new Error("Downloaded JDK did not contain java.exe");
  }

  const jdkRoot = path.dirname(path.dirname(javaExe));
  removeDir(LOCAL_JDK_DIR);
  fs.renameSync(jdkRoot, LOCAL_JDK_DIR);
  removeDir(extractDir);
  console.log("Local JDK installed.");
}

async function setupSdkManager() {
  if (getSdkManager(LOCAL_SDK_DIR)) {
    console.log("Android command line tools are ready.");
    return;
  }

  const zipFile = path.join(DOWNLOAD_DIR, "android-commandline-tools.zip");
  const extractDir = path.join(LOCAL_ANDROID_DIR, "cmdline-tools-extract");
  await download(CMDLINE_TOOLS_URL, zipFile);
  expandZip(zipFile, extractDir);

  const sdkManager = findFile(extractDir, "sdkmanager.bat");
  if (!sdkManager) {
    throw new Error("Downloaded Android command line tools did not contain sdkmanager.bat");
  }

  const cmdlineRoot = path.dirname(path.dirname(sdkManager));
  const latestDir = path.join(LOCAL_SDK_DIR, "cmdline-tools", "latest");
  removeDir(latestDir);
  copyRecursive(cmdlineRoot, latestDir);
  removeDir(extractDir);
  console.log("Android command line tools installed.");
}

function installSdkPackages() {
  const sdkManager = getSdkManager(LOCAL_SDK_DIR);
  const env = getAndroidEnv();

  if (!hasAcceptedLicenses()) {
    console.log("Accepting Android SDK licenses...");
    run(sdkManager, [`--sdk_root=${LOCAL_SDK_DIR}`, "--licenses"], {
      env,
      input: "y\n".repeat(80),
      shell: true
    });
  } else {
    console.log("Android SDK licenses are accepted.");
  }

  console.log("Installing Android SDK packages...");
  run(sdkManager, [
    `--sdk_root=${LOCAL_SDK_DIR}`,
    "platform-tools",
    "platforms;android-36",
    "build-tools;36.0.0"
  ], { env, shell: true });

  writeLocalProperties();
  console.log("Android SDK is ready.");
}

async function main() {
  if (process.platform !== "win32") {
    throw new Error("This local setup script currently targets Windows.");
  }

  ensureDir(LOCAL_ANDROID_DIR);
  ensureDir(DOWNLOAD_DIR);
  await setupJdk();
  await setupSdkManager();
  installSdkPackages();
  console.log("Local Android build tools are ready. Run: npm.cmd run android:build");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
