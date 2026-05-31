# PWA Installable App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing reading-note web page into a phone-installable PWA while keeping the current single-page app and data model intact.

**Architecture:** Keep `index.html` as the app shell and add PWA metadata around it. Use `manifest.webmanifest` for install metadata, `service-worker.js` for app-shell caching, and generated PNG icons for Android/iOS home-screen presentation. Do not change IndexedDB, CSV import, LAN sync, or reading-record storage.

**Tech Stack:** Single-page HTML, vanilla JavaScript, Web App Manifest, Service Worker Cache API, PNG app icons.

---

### Task 1: App Manifest And Icons

**Files:**
- Create: `manifest.webmanifest`
- Create: `icons/icon-192.png`
- Create: `icons/icon-512.png`
- Create: `icons/maskable-512.png`
- Create: `icons/apple-touch-icon.png`

- [x] **Step 1: Add manifest metadata**

Create a manifest that uses relative paths so it works on GitHub Pages under `/Codex/` and locally under a dev server.

- [x] **Step 2: Generate app icons**

Generate simple paper-and-quote themed PNG icons in 192, 512, maskable 512, and Apple touch sizes.

### Task 2: Service Worker

**Files:**
- Create: `service-worker.js`

- [x] **Step 1: Precache local app shell**

Cache `./`, `./index.html`, the manifest, and icon files.

- [x] **Step 2: Add runtime caching**

Use network-first for page navigation and stale-while-revalidate for same-origin assets. Allow CDN dependencies to be cached opportunistically after they load online.

### Task 3: HTML PWA Hooks

**Files:**
- Modify: `index.html`

- [x] **Step 1: Add mobile app metadata**

Add manifest, theme color, icon, and iOS home-screen tags to `<head>`.

- [x] **Step 2: Register service worker safely**

Register `service-worker.js` only on `http:` or `https:` pages, not `file://`, so the direct local file mode keeps working without console errors.

### Task 4: Documentation And Verification

**Files:**
- Modify: `README.md`

- [x] **Step 1: Document mobile installation**

Add Android Chrome and iPhone Safari installation steps, plus a note that installability needs HTTPS such as GitHub Pages.

- [x] **Step 2: Verify static files**

Run syntax checks for inline scripts and the service worker.

- [x] **Step 3: Commit**

Commit the PWA files and documentation.
