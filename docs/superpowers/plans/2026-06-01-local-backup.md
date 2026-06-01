# Local Backup Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local backup and recovery center with JSON export/import, automatic snapshots, desktop file backup, server-side sync backups, data health checks, reading-record CSV export, and favorites.

**Architecture:** Keep the project as a single-page app. Extend the existing IndexedDB schema with a local-only `backups` store, reuse the current full snapshot shape, and route all restore operations through existing storage refresh paths. Enhance `sync-server.js` with safe local file snapshots before overwriting `sync-data.json`.

**Tech Stack:** Single-file HTML/CSS/JavaScript, Tailwind CDN, PapaParse, IndexedDB, File System Access API when available, Node.js built-in modules for the LAN sync server.

---

### Task 1: Data Model And Backup Store

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Extend constants and schema**

Change the database constants to:

```js
const DB_VERSION = 3;
const BACKUPS_STORE = "backups";
const BACKUP_FILE_TYPE = "reading-note-reviewer-backup";
const BACKUP_VERSION = 1;
const MAX_LOCAL_BACKUPS = 10;
```

In `openDatabase().onupgradeneeded`, add:

```js
if (!nextDb.objectStoreNames.contains(BACKUPS_STORE)) {
  const backupsStore = nextDb.createObjectStore(BACKUPS_STORE, { keyPath: "id" });
  backupsStore.createIndex("createdAt", "createdAt", { unique: false });
  backupsStore.createIndex("kind", "kind", { unique: false });
}
```

- [ ] **Step 2: Preserve favorite compatibility**

Change `createNote()` to add:

```js
favorite: Boolean(data.favorite)
```

Make sure every place that creates a note preserves `existingNote?.favorite`.

- [ ] **Step 3: Add generic backup helpers**

Add helpers for `createBackupEnvelope(snapshot, source)`, `normalizeBackupPayload(payload)`, `summarizeSnapshot(snapshot)`, `mergeSnapshots(current, incoming)`, and `applySnapshot(snapshot, mode, source)`.

- [ ] **Step 4: Verify syntax**

Run:

```powershell
npm run verify
```

Expected: JSON output with `"ok":true`.

### Task 2: Backup Center UI

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add hidden backup file input**

Near the current CSV and font inputs, add:

```html
<input id="backupInput" type="file" accept=".json,application/json" class="sr-only" />
```

- [ ] **Step 2: Add settings home entry**

Add an `openBackupButton` card to the settings home grid:

```html
<button id="openBackupButton" type="button" class="flex w-full items-center justify-between rounded-[18px] border border-borderSoft/10 bg-surfaceSoft px-5 py-4 text-left transition hover:border-sage/35 hover:bg-sage/5 focus:outline-none focus:ring-4 focus:ring-sage/15">
  <span>
    <span class="block text-base font-semibold text-ink">备份与恢复</span>
    <span class="mt-1 block text-sm leading-6 text-muted">导出、恢复、本地快照和数据体检</span>
  </span>
  <span class="text-xl text-sage" aria-hidden="true">›</span>
</button>
```

- [ ] **Step 3: Add backup settings view**

Add `settingsBackupView` with sections for overview, manual backup, local snapshots, desktop file backup, and health check. Use existing rounded card styles and compact mobile spacing.

- [ ] **Step 4: Wire elements**

Add the new DOM elements to `elements`, wire `openBackupButton` to `showSettingsView("backup")`, and make `showSettingsView("backup")` call `renderBackupCenter()`.

### Task 3: Export, Import, Restore, And Snapshots

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Manual export**

Implement `exportFullBackup()` using `storage.loadAll()` in LAN mode and `loadLocalSnapshot()` in local mode, then download a formatted JSON blob named:

```text
reading-note-reviewer-backup-YYYYMMDD-HHmmss.json
```

- [ ] **Step 2: Manual import**

Implement `handleBackupFile(file)` with JSON parsing, summary confirmation, and a two-step prompt:

```js
const useReplace = window.confirm("选择“确定”完全覆盖当前数据；选择“取消”则合并导入。");
```

Before replace, call `createLocalBackup("restore-before-replace", "auto")`.

- [ ] **Step 3: Local snapshots**

Implement `createLocalBackup(source, kind = "auto")`, `loadLocalBackups()`, `deleteLocalBackup(id)`, `restoreLocalBackup(id)`, and `pruneLocalBackups()`.

High-risk operations call `createLocalBackup()` before mutation:

- CSV import replace.
- Clear notes.
- Restore backup replace.
- Restore local snapshot.

- [ ] **Step 4: Refresh after restore**

After restore, reload state into `notes`, `readingEvents`, `customFonts`, and `displaySettings`, then run:

```js
await registerFonts(customFonts);
applyDisplaySettings();
updateReadingStats();
updateNoteCounts();
renderLibrary();
renderReadingRecords();
renderBackupCenter();
```

### Task 4: Favorites And Review Scope

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add state**

Add:

```js
let reviewScope = "all";
```

Add helpers:

```js
function getReviewNotes() {
  return reviewScope === "favorites" ? notes.filter((note) => note.favorite) : notes;
}
```

- [ ] **Step 2: Add reading card favorite button**

Add a small favorite button in the reading card area and wire it to `toggleFavorite(noteId)`.

- [ ] **Step 3: Keep navigation index-safe**

For random, previous, and next navigation, continue using `notes` as the source of truth, but choose candidates from `getReviewNotes()`. Convert the chosen note back to its `notes` index with `findNoteIndexById()`.

- [ ] **Step 4: Add library favorite controls**

In each library item, add a `data-note-action="favorite"` button and update the click handler.

### Task 5: Data Health And Reading CSV Export

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add health calculation**

Implement `getDataHealthReport()` returning empty note count, duplicate groups, orphan reading events, and large fonts.

- [ ] **Step 2: Render health cards**

In `renderBackupCenter()`, show compact cards with counts and a duplicate preview list.

- [ ] **Step 3: Export records CSV**

Implement `exportReadingRecordsCsv()` using `Papa.unparse()` and include note metadata for each reading event.

### Task 6: Desktop File Backup

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add File System Access guards**

Show desktop file backup controls only when:

```js
Boolean(window.showSaveFilePicker)
```

- [ ] **Step 2: Implement write flow**

Implement `writeBackupToChosenFile()` that opens a save picker and writes the current backup JSON to the selected file.

- [ ] **Step 3: Graceful fallback**

When unsupported, render a short hint to use the normal export button.

### Task 7: LAN Server Backups And Docs

**Files:**
- Modify: `sync-server.js`
- Modify: `.gitignore`
- Modify: `README.md`

- [ ] **Step 1: Add server backup helpers**

In `sync-server.js`, add `BACKUP_DIR`, `MAX_SERVER_BACKUPS`, `formatBackupStamp()`, `backupExistingDataFile()`, and `pruneServerBackups()`.

- [ ] **Step 2: Call before save**

In `saveState()`, before writing the temp file, call:

```js
backupExistingDataFile();
```

Log warnings but do not block normal sync writes.

- [ ] **Step 3: Ignore generated backup folder**

Add:

```gitignore
backups/
```

- [ ] **Step 4: Document usage**

Add README sections for backup center, local snapshots, desktop backup file, and LAN server backups.

### Task 8: Verification And GitHub Sync

**Files:**
- Modify as needed only for fixes found during verification.

- [ ] **Step 1: Run syntax verification**

Run:

```powershell
npm run verify
```

Expected: `"ok":true`.

- [ ] **Step 2: Refresh packaged web assets when needed**

Run:

```powershell
npm run cap:copy
```

Expected: command succeeds and Capacitor receives the updated web assets.

- [ ] **Step 3: Inspect git diff**

Run:

```powershell
git --git-dir=_git --work-tree=. status --short
git --git-dir=_git --work-tree=. diff --stat
```

- [ ] **Step 4: Commit and push**

Commit with:

```powershell
git --git-dir=_git --work-tree=. add index.html sync-server.js README.md .gitignore docs/superpowers/plans/2026-06-01-local-backup.md
git --git-dir=_git --work-tree=. commit -m "feat: add local backup center"
git --git-dir=_git --work-tree=. push origin main
```
