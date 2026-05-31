const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const LOCAL_ANDROID_DIR = path.join(ROOT, ".android-local");
const LOCAL_JDK_DIR = path.join(LOCAL_ANDROID_DIR, "jdk");
const LOCAL_SDK_DIR = path.join(LOCAL_ANDROID_DIR, "android-sdk");
const LOCAL_GRADLE_HOME = path.join(ROOT, ".gradle-cache");

function hasFile(filePath) {
  return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

function getJavaExe(javaHome = process.env.JAVA_HOME) {
  if (!javaHome) {
    return "";
  }
  const exe = path.join(javaHome, "bin", process.platform === "win32" ? "java.exe" : "java");
  return hasFile(exe) ? exe : "";
}

function getSdkManager(sdkRoot = process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME) {
  if (!sdkRoot) {
    return "";
  }
  const exe = process.platform === "win32" ? "sdkmanager.bat" : "sdkmanager";
  const candidates = [
    path.join(sdkRoot, "cmdline-tools", "latest", "bin", exe),
    path.join(sdkRoot, "cmdline-tools", "bin", exe),
    path.join(sdkRoot, "tools", "bin", exe)
  ];
  return candidates.find(hasFile) || "";
}

function getGradleWrapper() {
  return path.join(ROOT, "android", process.platform === "win32" ? "gradlew.bat" : "gradlew");
}

function getAndroidEnv() {
  const javaHome = getJavaExe(LOCAL_JDK_DIR) ? LOCAL_JDK_DIR : process.env.JAVA_HOME;
  const sdkRoot = getSdkManager(LOCAL_SDK_DIR) ? LOCAL_SDK_DIR : process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME;
  const pathEntries = [];

  if (javaHome) {
    pathEntries.push(path.join(javaHome, "bin"));
  }

  if (sdkRoot) {
    pathEntries.push(
      path.join(sdkRoot, "cmdline-tools", "latest", "bin"),
      path.join(sdkRoot, "platform-tools"),
      path.join(sdkRoot, "build-tools", "36.0.0")
    );
  }

  return {
    ...process.env,
    JAVA_HOME: javaHome || "",
    ANDROID_HOME: sdkRoot || "",
    ANDROID_SDK_ROOT: sdkRoot || "",
    GRADLE_USER_HOME: LOCAL_GRADLE_HOME,
    _JAVA_OPTIONS: `${process.env._JAVA_OPTIONS || ""} -Djava.net.preferIPv4Stack=true`.trim(),
    PATH: [...pathEntries, process.env.PATH || ""].filter(Boolean).join(path.delimiter)
  };
}

module.exports = {
  ROOT,
  LOCAL_ANDROID_DIR,
  LOCAL_JDK_DIR,
  LOCAL_SDK_DIR,
  LOCAL_GRADLE_HOME,
  getAndroidEnv,
  getGradleWrapper,
  getJavaExe,
  getSdkManager,
  hasFile
};
