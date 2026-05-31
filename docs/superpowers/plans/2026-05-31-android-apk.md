# Android APK Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Package the existing reading-note reviewer as an Android APK and make the current browser app safer for mobile app use.

**Architecture:** Keep `index.html` as the source app. Vendor the browser dependencies locally, copy the web app into a `www/` Capacitor web directory, and use Capacitor Android to generate/build the native Android wrapper. Add only narrow app-shell support needed for APK use; do not rewrite the reader, IndexedDB schema, CSV parser flow, or reading-record model.

**Tech Stack:** Single-page HTML, vanilla JavaScript, PapaParse, Tailwind browser runtime, Capacitor Android, Gradle/Android SDK.

---

### Task 1: Local Web Dependencies

**Files:**
- Create: `vendor/tailwindcss-cdn.js`
- Create: `vendor/papaparse.min.js`
- Modify: `index.html`

- [x] **Step 1: Vendor Tailwind and PapaParse**

Download the same browser dependencies currently loaded from CDN into `vendor/`.

- [x] **Step 2: Switch HTML script tags**

Change `index.html` from CDN script URLs to `./vendor/tailwindcss-cdn.js` and `./vendor/papaparse.min.js`.

- [x] **Step 3: Verify direct browser mode**

Run the existing inline script syntax check and confirm no script parse errors.

### Task 2: Capacitor Project

**Files:**
- Create: `package.json`
- Create: `capacitor.config.json`
- Create: `tools/prepare-capacitor-web.js`
- Create: `www/` via script output
- Create: `android/` via Capacitor

- [x] **Step 1: Add npm metadata and scripts**

Add scripts for preparing web assets, syncing Capacitor, and building a debug APK.

- [x] **Step 2: Add Capacitor config**

Use app id `com.tianlutao.readingreview`, app name `读书回顾`, and web directory `www`.

- [x] **Step 3: Copy static assets into `www/`**

Copy `index.html`, `manifest.webmanifest`, `service-worker.js`, `icons/`, and `vendor/` into `www/`.

- [x] **Step 4: Add Android platform**

Install Capacitor packages and run Capacitor Android platform generation.

### Task 3: APK-Oriented Function Check

**Files:**
- Modify: `README.md`

- [x] **Step 1: Check web app syntax**

Run inline script syntax, service worker syntax, and sync server syntax checks.

- [x] **Step 2: Check static serving**

Run the local sync server and verify `index.html`, `manifest.webmanifest`, `service-worker.js`, and icons are served.

- [x] **Step 3: Build APK if toolchain exists**

Local APK build is blocked on this computer because Java/JDK is not installed (`JAVA_HOME is not set and no 'java' command could be found`). Added a GitHub Actions APK workflow so GitHub can build the debug APK in the cloud.

Run Gradle debug build. If Java or Android SDK is missing, record the exact missing tool and leave the Android project ready for Android Studio.

### Task 4: Documentation And Commit

**Files:**
- Modify: `README.md`

- [x] **Step 1: Document APK build and install**

Add commands for preparing, building, and installing the debug APK.

- [x] **Step 2: Commit**

Commit all APK-related files and documentation.
