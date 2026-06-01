# Lightweight Frontend Backend Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the current single-page app into a frontend asset layer and a lightweight Node backend layer without changing user data formats or product behavior.

**Architecture:** The first implementation creates the physical boundary: `index.html` becomes the page shell, frontend CSS/JS move into `src/`, and the local sync backend moves behind `server/index.js`. The backend keeps Node native HTTP and the frontend keeps vanilla JavaScript so PWA, APK, local IndexedDB, GitHub Pages, and LAN sync remain compatible.

**Tech Stack:** HTML, CSS, vanilla JavaScript ES modules where practical, Node.js native HTTP, IndexedDB, Capacitor web asset copy.

---

## File Structure

- Modify `index.html`: remove large inline CSS and app JavaScript; reference `src/styles.css`, `src/tailwind-config.js`, and `src/app.js`.
- Create `src/styles.css`: contains the custom CSS currently embedded in `index.html`.
- Create `src/tailwind-config.js`: contains the existing Tailwind runtime config.
- Create `src/app.js`: contains the current frontend app JavaScript as the first compatibility-preserving extraction.
- Modify `sync-server.js`: keep it as a compatibility entry that requires `server/index.js`.
- Create `server/index.js`: contains the existing LAN sync server implementation for this first backend split.
- Modify `tools/verify-app.js`: validate extracted frontend scripts and backend entry.
- Modify `tools/prepare-capacitor-web.js`: copy `src/` and `server/`-compatible static assets.
- Modify `.gitignore`: ignore `.git-empty-backup/`.

---

### Task 1: Stabilize Git Metadata Handling

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Ignore the empty Git backup**

Add this line under the local temporary section:

```gitignore
.git-empty-backup/
```

- [ ] **Step 2: Verify repository status with explicit work tree**

Run:

```powershell
git --git-dir=.git --work-tree=. status --short --branch
```

Expected: `## main...origin/main` plus the new plan/spec files if not committed.

---

### Task 2: Extract Frontend Assets

**Files:**
- Modify: `index.html`
- Create: `src/styles.css`
- Create: `src/tailwind-config.js`
- Create: `src/app.js`

- [ ] **Step 1: Extract Tailwind config**

Move the first inline script from `index.html` into `src/tailwind-config.js` exactly as executable browser JavaScript:

```js
tailwind.config = {
  theme: {
    extend: {
      colors: {
        paper: "rgb(var(--color-paper) / <alpha-value>)"
      }
    }
  }
};
```

The actual file must preserve the full current color and shadow config.

- [ ] **Step 2: Extract custom CSS**

Move the content inside the `<style>...</style>` block into `src/styles.css` without changing selectors.

Add this to `index.html` after vendor scripts:

```html
<link rel="stylesheet" href="./src/styles.css" />
```

- [ ] **Step 3: Extract frontend JavaScript**

Move the large app script into `src/app.js`.

Replace the app script in `index.html` with:

```html
<script src="./src/app.js"></script>
```

Keep it as a non-module script for this first pass so existing top-level code and browser globals remain behavior-compatible.

- [ ] **Step 4: Verify extracted references**

Run:

```powershell
rg -n "src/styles.css|src/tailwind-config.js|src/app.js|<style>|async function initApp" index.html src
```

Expected:
- `index.html` references the three `src/` files.
- `src/app.js` contains `async function initApp`.
- `index.html` no longer contains the large custom `<style>` block.

---

### Task 3: Split Backend Entry

**Files:**
- Modify: `sync-server.js`
- Create: `server/index.js`

- [ ] **Step 1: Move server implementation**

Move the current content of `sync-server.js` into `server/index.js`.

- [ ] **Step 2: Keep compatibility entry**

Replace `sync-server.js` with:

```js
require("./server/index");
```

- [ ] **Step 3: Adjust server root**

Because `server/index.js` now lives one directory deeper, set:

```js
const ROOT = path.resolve(__dirname, "..");
```

instead of:

```js
const ROOT = __dirname;
```

- [ ] **Step 4: Verify server starts**

Run:

```powershell
node sync-server.js
```

Expected: the server prints desktop and mobile addresses. Stop it after confirming.

---

### Task 4: Update Build and Verification Scripts

**Files:**
- Modify: `tools/verify-app.js`
- Modify: `tools/prepare-capacitor-web.js`

- [ ] **Step 1: Update Capacitor copy list**

Add `src` to `COPY_ENTRIES`:

```js
const COPY_ENTRIES = [
  "index.html",
  "manifest.webmanifest",
  "service-worker.js",
  "icons",
  "vendor",
  "src"
];
```

- [ ] **Step 2: Update verifier**

Change `tools/verify-app.js` so it:

```js
new Function(fs.readFileSync("src/tailwind-config.js", "utf8"));
new Function(fs.readFileSync("src/app.js", "utf8"));
new Function(fs.readFileSync("sync-server.js", "utf8"));
new Function(fs.readFileSync("server/index.js", "utf8"));
```

Also check that `index.html` references `./src/styles.css`, `./src/tailwind-config.js`, and `./src/app.js`.

- [ ] **Step 3: Run verification**

Run:

```powershell
npm.cmd run verify
```

Expected: exits successfully with JSON containing `"ok":true`.

- [ ] **Step 4: Run Capacitor copy**

Run:

```powershell
npm.cmd run cap:copy
```

Expected: `www/src/` is copied and the command exits successfully.

---

### Task 5: Validate and Record the Refactor

**Files:**
- Modify: `README.md` if needed only to mention the new structure.

- [ ] **Step 1: Static search checks**

Run:

```powershell
rg -n "src/app.js|server/index.js|sync-server.js|styles.css" README.md index.html tools server src
```

Expected: references are consistent with the new structure.

- [ ] **Step 2: Review changed files**

Run:

```powershell
git --git-dir=.git --work-tree=. diff --stat
```

Expected: changes are limited to frontend extraction, backend entry split, verification/copy tooling, docs, and `.gitignore`.

- [ ] **Step 3: Commit if Git metadata is writable**

Run:

```powershell
git --git-dir=.git --work-tree=. add .
git --git-dir=.git --work-tree=. commit -m "refactor: split frontend assets and sync backend"
```

Expected: commit succeeds. If `.git` permissions still block index writes, leave files in the working tree and report the exact manual commands.

---

## Self-Review

- Spec coverage: This plan implements the first lightweight physical split, preserves data formats, keeps `sync-server.js`, updates verification, and keeps APK resource copying functional.
- Placeholder scan: No placeholder tasks remain; each step names exact files and commands.
- Type consistency: Paths are consistent: frontend assets under `src/`, backend implementation at `server/index.js`, compatibility entry at `sync-server.js`.
