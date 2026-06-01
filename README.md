# 读书笔记随机回顾

一个单页读书笔记回顾应用，支持 CSV 导入、随机回顾、句子库管理、主题切换、本地字体、阅读记录，以及同一局域网内的电脑与手机同步。

## 直接使用

打开 `index.html` 即可使用本地模式。数据会保存在当前浏览器的 IndexedDB 中。

## 本地备份与恢复

右下角打开设置，进入“备份与恢复”可以管理数据安全：

- “导出完整备份”会生成一个 JSON 文件，包含句子库、主题设置、本地字体和阅读记录。
- “导入备份文件”支持合并导入或完全覆盖。覆盖前会自动创建一份本地快照。
- “创建本地快照”会在当前浏览器 IndexedDB 中保存一份恢复点，最近保留 10 份。
- “导出阅读记录 CSV”可以把每条停留记录导出为表格。
- 桌面 Chrome / Edge 支持“写入本地备份文件”，手机或不支持的浏览器可继续使用普通导出。

备份中心还会显示数据体检结果，包括疑似重复句子、孤立阅读记录和过大的本地字体。

## 安装到手机桌面

这个项目已经支持 PWA 安装。把仓库部署到 GitHub Pages 后，用手机打开 HTTPS 页面即可安装成类似原生 App 的独立窗口。

### Android

1. 用 Chrome 打开 GitHub Pages 页面。
2. 点击右上角菜单。
3. 选择“安装应用”或“添加到主屏幕”。
4. 从桌面图标打开“读书回顾”。

### iPhone

1. 用 Safari 打开 GitHub Pages 页面。
2. 点击底部分享按钮。
3. 选择“添加到主屏幕”。
4. 从主屏幕图标打开“读书回顾”。

PWA 安装和离线缓存需要 HTTPS 或 localhost。直接打开 `file://` 仍可正常使用本地模式，但浏览器不会注册离线缓存。

## 生成 Android APK

项目已经加入 Capacitor Android 工程，可以生成手机可安装的 APK。

### 在 GitHub 云端生成

1. 把最新代码同步到 GitHub。
2. 打开仓库的 `Actions` 页面。
3. 选择 `Build Android APK`。
4. 点击 `Run workflow`，等待任务完成。
5. 在任务详情底部下载 `reading-note-reviewer-debug-apk`，里面包含 `app-debug.apk`。

这是调试版 APK，安装到手机时可能需要允许“安装未知来源应用”。

### 在本机生成

可以使用项目自带脚本在当前目录安装一套便携构建工具，然后生成 APK：

```powershell
npm.cmd --cache .npm-cache install
npm.cmd run setup:android-local
npm.cmd run verify
npm.cmd run android:build
```

生成结果位于：

```text
android\app\build\outputs\apk\debug\app-debug.apk
```

便携 JDK、Android SDK 和 Gradle 缓存会放在项目目录的 `.android-local`、`.gradle-cache` 中，不会上传到 GitHub。如果你已经在系统里安装了 JDK 和 Android SDK，也可以运行 `npm.cmd run android:build:system` 使用系统环境构建。

如果在 Codex 沙箱里看到 `Unable to establish loopback connection`，请在普通 Windows PowerShell 里运行 `npm.cmd run android:build`。这是 Gradle 在受限沙箱内启动构建进程时的本地回环限制，不是项目代码或 APK 配置错误。

### APK 内使用局域网同步

APK 不是从电脑的 `http://localhost:8787/` 打开的，所以需要在 App 里手动填写同步地址：

1. 电脑双击 `start-sync.bat`。
2. 手机和电脑连接同一 Wi-Fi。
3. 在 App 右下角打开设置，进入同步区域。
4. 填入电脑端显示的 `Mobile` 地址，例如 `http://192.168.1.8:8787`。
5. 点击“保存同步地址”。

## 局域网同步

1. 双击 `start-sync.bat`。
2. 保持命令窗口开启。
3. 电脑打开 `http://localhost:8787/`。
4. 手机连接同一 Wi-Fi，打开命令窗口里显示的 `Mobile` 地址。

同步数据保存在本机生成的 `sync-data.json` 中。这个文件包含个人笔记和阅读记录，已在 `.gitignore` 中排除，不会上传到 GitHub。

同步服务每次覆盖 `sync-data.json` 前，会把旧文件复制到本机 `backups/` 目录，最近保留 10 份。这些备份同样已排除在 GitHub 之外。

## GitHub Pages 说明

GitHub Pages 可以托管静态版 `index.html`，用于本地浏览器存储和 CSV 导入。局域网同步需要运行 `sync-server.js`，GitHub Pages 不能运行这个本地同步服务。
