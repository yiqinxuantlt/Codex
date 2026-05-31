const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const {
  LOCAL_JDK_DIR,
  LOCAL_SDK_DIR,
  ROOT,
  getAndroidEnv,
  getGradleWrapper,
  getJavaExe,
  getSdkManager
} = require("./android-local");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || ROOT,
    env: options.env || getAndroidEnv(),
    stdio: "inherit",
    shell: Boolean(options.shell)
  });

  if (result.status !== 0) {
    if (result.error) {
      console.error(result.error.message);
    }
    process.exit(result.status || 1);
  }
}

function ensureToolchain() {
  const java = getJavaExe(LOCAL_JDK_DIR) || getJavaExe();
  const sdkManager = getSdkManager(LOCAL_SDK_DIR) || getSdkManager();

  if (!java || !sdkManager) {
    console.error("Local Android build tools are not ready.");
    console.error("Run: npm.cmd run setup:android-local");
    process.exit(1);
  }
}

function main() {
  ensureToolchain();
  const env = getAndroidEnv();
  const useShell = process.platform === "win32";
  run(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "cap:sync"], { env, shell: useShell });
  run(getGradleWrapper(), ["--no-daemon", "assembleDebug"], { cwd: path.join(ROOT, "android"), env, shell: useShell });

  const apkPath = path.join(ROOT, "android", "app", "build", "outputs", "apk", "debug", "app-debug.apk");
  if (!fs.existsSync(apkPath)) {
    console.error("Gradle finished, but APK was not found.");
    process.exit(1);
  }

  console.log(`APK ready: ${apkPath}`);
}

main();
