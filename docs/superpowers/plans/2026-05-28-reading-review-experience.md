# Reading Review Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the single-file reading notes app with polished reading UI, mobile swipe navigation, per-note dwell-time reading records, and improved library display.

**Architecture:** Keep the app as one `index.html`, but organize changes into clear in-file sections: theme/UI tokens, IndexedDB helpers, reading session tracking, note navigation, gesture handling, rendering, and verification. Upgrade IndexedDB from version 1 to 2 with a new `readingEvents` store while preserving existing `notes`, `settings`, and `fonts`.

**Tech Stack:** Single HTML file, Tailwind CDN, PapaParse CDN, IndexedDB, native Pointer Events, CSS custom properties, Playwright-based browser verification.

---

### Task 1: IndexedDB Reading Events

**Files:**
- Modify: `C:\Users\TianLutao\Documents\Codex\2026-05-28\single-page-html-html-css-javascript\index.html`

- [ ] **Step 1: Add constants and database store**

Add `READING_EVENTS_STORE = "readingEvents"` and bump `DB_VERSION` from `1` to `2`. In `openDatabase().onupgradeneeded`, create the `readingEvents` object store with key path `id` and indexes `noteId`, `dateKey`, `startedAt`, and `endedAt`.

- [ ] **Step 2: Add event persistence and aggregation helpers**

Add helpers to create date keys, format durations, format recent times, save reading events, load all events, aggregate today/total stats, and aggregate per-note stats.

- [ ] **Step 3: Verify**

Run the inline JavaScript syntax check:

```powershell
node -e "const fs=require('fs'); const html=fs.readFileSync('index.html','utf8'); const scripts=html.split('<script>').slice(1).map(s=>s.split('</script>')[0].trim()).filter(Boolean); for (const s of scripts) new Function(s); console.log(JSON.stringify({scripts:scripts.length,ok:true}));"
```

Expected: `{"scripts":2,"ok":true}`.

### Task 2: Reading Session Tracking

**Files:**
- Modify: `C:\Users\TianLutao\Documents\Codex\2026-05-28\single-page-html-html-css-javascript\index.html`

- [ ] **Step 1: Add session state**

Add a `readingSession` object with `noteId`, `startedAt`, and `source`, plus a minimum dwell threshold of `800ms`.

- [ ] **Step 2: Add start/commit functions**

Implement `startReadingSession(noteId, source)` and `commitReadingSession(reason)`. Commit events when navigating away from a note, when the page becomes hidden, and before unload where possible.

- [ ] **Step 3: Wire display changes**

Update note display flow so every note switch commits the previous note and starts a new session for the displayed note.

### Task 3: Navigation and Swipe

**Files:**
- Modify: `C:\Users\TianLutao\Documents\Codex\2026-05-28\single-page-html-html-css-javascript\index.html`

- [ ] **Step 1: Add visible controls**

Add previous and next buttons around the random button. Make all controls at least 44px tall on mobile.

- [ ] **Step 2: Add navigation functions**

Implement `showPreviousNote(source)`, `showNextNote(source)`, and update `showRandomNote(source)`. Left swipe maps to previous, right swipe maps to next.

- [ ] **Step 3: Add pointer gesture handling**

Attach pointer listeners to the reading card area. Trigger horizontal navigation when horizontal movement exceeds `48px` and is at least `1.4x` vertical movement. Disable while settings are open.

### Task 4: UI Polish and Mobile Layout

**Files:**
- Modify: `C:\Users\TianLutao\Documents\Codex\2026-05-28\single-page-html-html-css-javascript\index.html`

- [ ] **Step 1: Upgrade layout tokens**

Use `min-height: 100dvh`, add card max-width constraints, mobile safe bottom spacing, refined animation classes, and reduced-motion fallbacks.

- [ ] **Step 2: Improve library cards**

Show source, view count, accumulated dwell time, and last viewed time on each note card. Keep two-line preview and expandable full text.

- [ ] **Step 3: Improve visual feedback**

Use directional swap animation for previous/next, subtle random animation for random, and a small mobile swipe hint.

### Task 5: Reading Records View

**Files:**
- Modify: `C:\Users\TianLutao\Documents\Codex\2026-05-28\single-page-html-html-css-javascript\index.html`

- [ ] **Step 1: Add settings entry and view**

Add a “阅读记录” entry to the settings home. Create a new settings view containing summary cards and expandable per-note records.

- [ ] **Step 2: Render summary**

Show today duration, today view count, total duration, and total view count.

- [ ] **Step 3: Render per-note expandable details**

Sort records by total dwell time. Each row shows note preview, source, view count, total dwell time, last viewed time, and the latest five dwell events.

### Task 6: Verification

**Files:**
- Temporary create/delete: `_verify-reading-experience.cjs`
- Modify: `C:\Users\TianLutao\Documents\Codex\2026-05-28\single-page-html-html-css-javascript\index.html`

- [ ] **Step 1: Browser verification**

Use a temporary local HTTP server and Playwright with Edge to verify import, previous/next/random, swipe gestures at `390px`, settings drawer behavior, reading event persistence, and reading record aggregation.

- [ ] **Step 2: Clean temporary files**

Delete `_verify-reading-experience.cjs`.

- [ ] **Step 3: Final syntax check**

Run the inline JavaScript syntax check again. Expected output remains `{"scripts":2,"ok":true}`.
