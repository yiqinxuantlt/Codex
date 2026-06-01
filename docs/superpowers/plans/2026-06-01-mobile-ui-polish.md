# Mobile UI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the single-page reading-note app with a mobile-first “墨韵纸页 + 夜读书灯” visual system while preserving all existing data, sync, backup, and APK logic.

**Architecture:** Keep the app as one `index.html`. Make most changes in CSS tokens, responsive rules, and existing Tailwind class strings; only touch JavaScript templates where generated cards need new classes or shorter mobile hierarchy. Verification covers syntax, Capacitor asset copy, and mobile viewports 360/375/390/414px.

**Tech Stack:** Single HTML file, Tailwind CDN utility classes, vanilla JavaScript, IndexedDB unchanged, PapaParse unchanged, Capacitor web asset copy.

---

### Task 1: Baseline And Safety Checks

**Files:**
- Read: `C:\Users\TianLutao\Documents\Codex\2026-05-28\single-page-html-html-css-javascript\index.html`
- Read: `C:\Users\TianLutao\Documents\Codex\2026-05-28\single-page-html-html-css-javascript\docs\superpowers\specs\2026-06-01-mobile-ui-polish-design.md`
- No file changes expected in this task.

- [ ] **Step 1: Confirm worktree state**

Run:

```powershell
git --git-dir=_git --work-tree=. status --short --branch
```

Expected: clean working tree except the committed design branch being ahead of origin.

- [ ] **Step 2: Run current app verification**

Run:

```powershell
npm.cmd run verify
```

Expected: JSON output containing `"ok":true`.

- [ ] **Step 3: Locate current mobile CSS sections**

Run:

```powershell
rg -n "@media \\(max-width: 639px\\)|#readingCard|#reviewControls|settings-panel|records-chart-card|data-settings-view" index.html
```

Expected: locations for the existing mobile breakpoint, reading card, controls, settings panel, and records styles.

### Task 2: Theme Tokens And Paper/Night Visual System

**Files:**
- Modify: `C:\Users\TianLutao\Documents\Codex\2026-05-28\single-page-html-html-css-javascript\index.html`

- [ ] **Step 1: Extend CSS variables**

In the `:root` block, add semantic tokens after `--shadow-card`:

```css
--surface-raised: rgba(255, 255, 255, 0.78);
--surface-inset: rgba(251, 250, 246, 0.82);
--line-soft: rgba(45, 41, 35, 0.1);
--accent-warm: 194 151 92;
--shadow-paper: 0 22px 58px rgba(62, 51, 37, 0.11), 0 2px 10px rgba(62, 51, 37, 0.06);
--shadow-sheet: 0 28px 90px rgba(62, 51, 37, 0.18), 0 5px 18px rgba(62, 51, 37, 0.08);
--motion-fast: 180ms;
--motion-medium: 300ms;
```

- [ ] **Step 2: Update theme variants**

Add these theme-specific values for `html[data-theme="night"]`:

```css
--surface-raised: rgba(31, 36, 33, 0.88);
--surface-inset: rgba(37, 42, 39, 0.78);
--line-soft: rgba(239, 232, 215, 0.105);
--accent-warm: 214 181 118;
--shadow-paper: 0 24px 76px rgba(0, 0, 0, 0.38), 0 2px 14px rgba(0, 0, 0, 0.28);
--shadow-sheet: 0 32px 96px rgba(0, 0, 0, 0.52), 0 5px 22px rgba(0, 0, 0, 0.32);
```

Also update the night color values:

```css
--color-paper: 15 18 17;
--color-surface: 27 31 29;
--color-surface-soft: 34 39 36;
--color-ink: 239 232 215;
--color-muted: 177 165 142;
--color-sage: 153 177 141;
--color-clay: 222 154 111;
--accent-warm: 214 181 118;
--grid-line: rgba(214, 181, 118, 0.035);
--grain-dot: rgba(244, 231, 201, 0.09);
```

Add these values for `sepia`:

```css
--surface-raised: rgba(254, 248, 234, 0.84);
--surface-inset: rgba(247, 237, 214, 0.82);
--line-soft: rgba(62, 45, 32, 0.105);
--accent-warm: 189 138 75;
--shadow-paper: 0 23px 66px rgba(88, 58, 28, 0.14), 0 3px 13px rgba(88, 58, 28, 0.07);
--shadow-sheet: 0 30px 88px rgba(88, 58, 28, 0.2), 0 5px 18px rgba(88, 58, 28, 0.1);
```

Add these values for `green`:

```css
--surface-raised: rgba(250, 253, 247, 0.84);
--surface-inset: rgba(238, 246, 235, 0.82);
--line-soft: rgba(37, 50, 43, 0.105);
--accent-warm: 176 132 86;
--shadow-paper: 0 23px 64px rgba(42, 75, 55, 0.12), 0 3px 12px rgba(42, 75, 55, 0.07);
--shadow-sheet: 0 30px 86px rgba(42, 75, 55, 0.18), 0 5px 18px rgba(42, 75, 55, 0.09);
```

- [ ] **Step 3: Refine body background**

Replace the current `body` background with a layered paper background:

```css
background:
  radial-gradient(circle at 14% 8%, rgb(var(--accent-warm) / 0.08), transparent 28rem),
  radial-gradient(circle at 86% 2%, rgb(var(--color-sage) / 0.08), transparent 24rem),
  linear-gradient(90deg, var(--grid-line) 1px, transparent 1px),
  linear-gradient(var(--grid-line) 1px, transparent 1px),
  rgb(var(--color-paper));
```

Keep `background-size` stable for the grid layers.

- [ ] **Step 4: Run syntax check**

Run:

```powershell
npm.cmd run verify
```

Expected: `"ok":true`.

### Task 3: Reading Page Mobile Layout And Card Polish

**Files:**
- Modify: `C:\Users\TianLutao\Documents\Codex\2026-05-28\single-page-html-html-css-javascript\index.html`

- [ ] **Step 1: Add readable class hooks to markup**

Update the reading page markup:

```html
<section id="reviewView" class="reader-view hidden w-full max-w-4xl">
<div id="readerMeta" class="reader-meta mb-5 flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 px-1 text-xs leading-5 text-muted sm:text-sm">
<article id="readingCard" class="reading-card fade-in relative w-full max-w-3xl touch-pan-y rounded-[28px] border border-borderSoft/10 bg-surface px-6 py-8 shadow-card sm:rounded-[30px] sm:px-12 sm:py-12 md:px-16 md:py-14">
<div id="reviewControls" class="review-controls mt-8 flex w-full max-w-2xl flex-wrap items-center justify-center gap-3 sm:mt-9 sm:gap-4">
```

Do not remove IDs because JavaScript depends on them.

- [ ] **Step 2: Replace reading card base CSS**

Add a polished base block near `#readingCard`:

```css
.reading-card {
  background:
    linear-gradient(135deg, rgb(var(--color-surface) / 0.92), rgb(var(--color-surface-soft) / 0.78));
  border-color: var(--line-soft);
  box-shadow: var(--shadow-paper);
}

.reading-card::after {
  content: "";
  position: absolute;
  inset: 1px;
  border-radius: inherit;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(255,255,255,.34), transparent 42%);
  opacity: .7;
}
```

In night mode, reduce the highlight:

```css
html[data-theme="night"] .reading-card::after {
  background: radial-gradient(circle at 50% 0%, rgb(var(--accent-warm) / 0.1), transparent 48%);
  opacity: 1;
}
```

- [ ] **Step 3: Tune mobile reading sizing**

Inside `@media (max-width: 639px)`, replace the mobile reading sizes with:

```css
#reviewStage {
  min-height: calc(100svh - 6.5rem);
  justify-content: center;
}

#readerMeta {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  margin-bottom: .65rem;
}

#swipeHint {
  grid-column: 1 / -1;
}

#readingCard {
  max-height: min(54svh, 28rem);
  border-radius: 20px;
  padding: clamp(1.25rem, 4.6vw, 1.65rem);
}

#quoteWrap {
  max-height: calc(min(54svh, 28rem) - 2.35rem);
}
```

Also add matching `100dvh` overrides in the existing `@supports (height: 100dvh)` block.

- [ ] **Step 4: Make controls stable**

Inside mobile media query, keep a three-column grid at 375px+ and two-line grid below 374px. Update button height to at least `2.9rem` and remove the `✨` from the random button text in HTML:

```html
随机回顾
```

- [ ] **Step 5: Verify app syntax**

Run:

```powershell
npm.cmd run verify
```

Expected: `"ok":true`.

### Task 4: Import Page And Floating Settings Button Polish

**Files:**
- Modify: `C:\Users\TianLutao\Documents\Codex\2026-05-28\single-page-html-html-css-javascript\index.html`

- [ ] **Step 1: Add import page hooks**

Change:

```html
<section id="importView" class="import-view fade-in w-full max-w-xl text-center">
```

Change the upload wrapper:

```html
<div class="import-card mt-10 rounded-[28px] border border-borderSoft/10 bg-surface/72 p-7 shadow-card backdrop-blur-sm sm:p-9">
```

Change the upload label:

```html
class="import-dropzone group flex cursor-pointer flex-col items-center justify-center rounded-[22px] border border-dashed border-sage/35 bg-surfaceSoft px-6 py-12 transition hover:border-sage/70 hover:bg-surface focus-within:ring-4 focus-within:ring-sage/15"
```

- [ ] **Step 2: Add import CSS**

Add:

```css
.import-card {
  background: var(--surface-raised);
  border-color: var(--line-soft);
  box-shadow: var(--shadow-paper);
}

.import-dropzone {
  background:
    linear-gradient(135deg, rgb(var(--color-surface-soft) / .86), rgb(var(--color-surface) / .72));
  border-color: rgb(var(--color-sage) / .28);
}

.import-dropzone:hover {
  border-color: rgb(var(--color-sage) / .55);
  background: rgb(var(--color-surface) / .92);
}
```

- [ ] **Step 3: Replace settings icon text**

Replace the settings button visible content from:

```html
⚙
```

to:

```html
<span aria-hidden="true">☰</span>
```

Keep `aria-label="打开设置"`.

- [ ] **Step 4: Mobile safe area**

Ensure the existing `#settingsButton` mobile rule remains:

```css
bottom: calc(0.85rem + env(safe-area-inset-bottom));
right: calc(0.85rem + env(safe-area-inset-right));
height: 2.9rem;
width: 2.9rem;
```

### Task 5: Settings Sheet And Index Card Hierarchy

**Files:**
- Modify: `C:\Users\TianLutao\Documents\Codex\2026-05-28\single-page-html-html-css-javascript\index.html`

- [ ] **Step 1: Add settings hooks**

Update settings markup:

```html
<aside id="settingsPanel" class="settings-panel settings-sheet pointer-events-auto absolute inset-x-4 bottom-4 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[26px] border border-borderSoft/10 bg-surface p-6 shadow-card sm:inset-y-4 sm:left-auto sm:right-4 sm:w-[410px] sm:rounded-[28px] sm:p-7">
<div id="settingsHomeView" data-settings-view="home" class="settings-home">
```

Add `settings-nav-card` to these buttons:

- `openLibraryButton`
- `openStyleButton`
- `openRecordsButton`
- `openBackupButton`
- `reimportButton`
- `clearDataButton`

- [ ] **Step 2: Add settings sheet CSS**

Add:

```css
.settings-sheet {
  background:
    linear-gradient(180deg, rgb(var(--color-surface) / .96), rgb(var(--color-surface-soft) / .92));
  border-color: var(--line-soft);
  box-shadow: var(--shadow-sheet);
}

.settings-nav-card {
  background: var(--surface-inset);
  border-color: var(--line-soft);
  box-shadow: 0 10px 28px rgb(var(--color-border) / .045);
}

.settings-nav-card:hover {
  border-color: rgb(var(--color-sage) / .36);
  background: rgb(var(--color-surface) / .88);
}
```

- [ ] **Step 3: Compress mobile settings**

Inside `@media (max-width: 639px)`, add:

```css
.settings-nav-card {
  border-radius: 16px !important;
  padding: .78rem .9rem !important;
}

.settings-nav-card .block.text-base {
  font-size: .92rem;
}

.settings-nav-card .mt-1 {
  margin-top: .18rem !important;
}
```

- [ ] **Step 4: Keep destructive actions distinct**

Ensure `#clearDataButton.settings-nav-card` receives a clay border:

```css
#clearDataButton.settings-nav-card {
  border-color: rgb(var(--color-clay) / .22);
}
```

### Task 6: Generated Cards, Lists, Records, And Backup Center

**Files:**
- Modify: `C:\Users\TianLutao\Documents\Codex\2026-05-28\single-page-html-html-css-javascript\index.html`

- [ ] **Step 1: Add shared generated-card class**

Add CSS:

```css
.generated-card {
  border: 1px solid var(--line-soft);
  background: var(--surface-inset);
  box-shadow: 0 10px 26px rgb(var(--color-border) / .045);
}

.mini-stat {
  border: 1px solid rgb(var(--color-sage) / .12);
  background: rgb(var(--color-sage) / .055);
}
```

- [ ] **Step 2: Update library card templates**

In `renderLibrary()`, replace the article class:

```js
<article class="generated-card rounded-[18px] p-4 transition hover:border-sage/25">
```

Replace stat chips:

```js
<span class="mini-stat rounded-full px-3 py-2 text-center">${viewCount} 次</span>
```

- [ ] **Step 3: Update records templates**

In `renderReadingRecords()`, use `generated-card` for `details` cards and `mini-stat` for chips. In `renderRecordCharts()`, update `.records-chart-card` CSS to use `var(--surface-inset)` and `var(--line-soft)`.

- [ ] **Step 4: Update backup center templates**

In `renderBackupCenter()` and `renderBackupHealth()`, use `generated-card` and `mini-stat` for snapshot cards, overview cards, and health cards.

- [ ] **Step 5: Run syntax check**

Run:

```powershell
npm.cmd run verify
```

Expected: `"ok":true`.

### Task 7: Motion Tuning And Reduced Motion

**Files:**
- Modify: `C:\Users\TianLutao\Documents\Codex\2026-05-28\single-page-html-html-css-javascript\index.html`

- [ ] **Step 1: Unify animation timings**

Change:

```css
.fade-in { animation: fadeIn 420ms ease both; }
.quote-swap { animation: quoteSwap var(--motion-medium) ease both; }
.quote-swap-next { animation: cardFlipNext 340ms cubic-bezier(0.2, 0.74, 0.22, 1) both; }
.quote-swap-previous { animation: cardFlipPrevious 340ms cubic-bezier(0.2, 0.74, 0.22, 1) both; }
```

- [ ] **Step 2: Reduce flip intensity**

Update keyframes:

```css
transform: translateX(12px) rotateY(-3deg) scale(0.996);
filter: blur(0.25px);
```

For previous, mirror the translate and rotation.

- [ ] **Step 3: Smooth sheet movement**

Use token duration:

```css
.settings-backdrop { transition: opacity var(--motion-fast) ease; }
.settings-panel { transition: transform var(--motion-medium) cubic-bezier(.2,.8,.2,1); }
```

- [ ] **Step 4: Preserve reduced motion**

Keep the existing `@media (prefers-reduced-motion: reduce)` block and ensure directional card animations fall back to `quoteSwap`.

### Task 8: Verification Across Mobile Sizes

**Files:**
- Modify: `C:\Users\TianLutao\Documents\Codex\2026-05-28\single-page-html-html-css-javascript\index.html` only when verification finds a visual or responsive regression.

- [ ] **Step 1: Run syntax verification**

Run:

```powershell
npm.cmd run verify
```

Expected: `"ok":true`.

- [ ] **Step 2: Copy web assets for APK packaging**

Run:

```powershell
npm.cmd run cap:copy
```

Expected:

```text
Prepared Capacitor web assets in www
copy android
```

- [ ] **Step 3: Check mobile widths**

Open `index.html` in the in-app browser or a Playwright-controlled browser and check:

- 360 x 740
- 375 x 812
- 390 x 844
- 414 x 896

For each width, confirm:

- `document.documentElement.scrollWidth <= window.innerWidth`
- Reading card and core buttons fit in the first screen.
- Settings button is above safe-area bottom.
- Settings sheet has no horizontal scroll.

- [ ] **Step 4: Check night theme**

In the app, open settings, switch to “黑夜”, and check:

- Reading card text remains readable.
- Buttons and card borders remain visible.
- No bright pure-white surfaces remain in the settings sheet.

- [ ] **Step 5: Review diff and commit**

Run:

```powershell
git --git-dir=_git --work-tree=. diff --stat
git --git-dir=_git --work-tree=. diff --check
```

Expected: no whitespace errors.

Commit:

```powershell
git --git-dir=_git --work-tree=. add index.html docs/superpowers/plans/2026-06-01-mobile-ui-polish.md
git --git-dir=_git --work-tree=. commit -m "style: polish mobile reading interface"
```

### Task 9: Optional GitHub Sync

**Files:**
- No file changes.

- [ ] **Step 1: Try push**

Run:

```powershell
git --git-dir=_git --work-tree=. push origin main
```

Expected: succeeds if GitHub credentials are available.

- [ ] **Step 2: If push fails for credentials**

Report the exact failure and tell the user to run:

```powershell
git --git-dir=_git --work-tree=. push origin main
```

Do not treat credential failure as a code failure.
