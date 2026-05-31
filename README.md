# 读书笔记随机回顾

一个单页读书笔记回顾应用，支持 CSV 导入、随机回顾、句子库管理、主题切换、本地字体、阅读记录，以及同一局域网内的电脑与手机同步。

## 直接使用

打开 `index.html` 即可使用本地模式。数据会保存在当前浏览器的 IndexedDB 中。

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

## 局域网同步

1. 双击 `start-sync.bat`。
2. 保持命令窗口开启。
3. 电脑打开 `http://localhost:8787/`。
4. 手机连接同一 Wi-Fi，打开命令窗口里显示的 `Mobile` 地址。

同步数据保存在本机生成的 `sync-data.json` 中。这个文件包含个人笔记和阅读记录，已在 `.gitignore` 中排除，不会上传到 GitHub。

## GitHub Pages 说明

GitHub Pages 可以托管静态版 `index.html`，用于本地浏览器存储和 CSV 导入。局域网同步需要运行 `sync-server.js`，GitHub Pages 不能运行这个本地同步服务。
