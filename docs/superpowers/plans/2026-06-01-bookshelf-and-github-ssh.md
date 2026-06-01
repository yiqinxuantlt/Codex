# Bookshelf and GitHub SSH Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a calm bookshelf view that groups excerpts by book, supports book-scoped review, and make GitHub sync more reliable by preparing SSH-based push.

**Architecture:** Keep the project as a single-page HTML app and derive books dynamically from the existing `notes` array. Do not change IndexedDB schema; book groups are computed in memory from note fields and reading statistics. Keep GitHub stabilization repo-local where possible, and create an SSH key only outside the repo after explicit system approval.

**Tech Stack:** Single-file HTML/CSS/JavaScript, Tailwind CDN, IndexedDB stores already present, Git, OpenSSH for Windows.

---

## File Structure

- Modify `index.html`
  - Add a settings-home entry for `书架`.
  - Add a `settingsBookshelfView` panel with list and detail states.
  - Add CSS for compact book cards, book-detail excerpt cards, mobile spacing, and night-theme polish.
  - Add JavaScript helpers to group notes by book, render bookshelf summaries, open a book detail, and start book-scoped review.
  - Keep all persistence in existing `notes`, `readingEvents`, and existing display/backup flows.
- Create `docs/github-ssh-setup.md`
  - Document the exact GitHub SSH setup path, public-key registration step, remote switch, and push test.
- Verify with existing project checks:
  - `npm run verify`
  - `npm run cap:copy`
  - `git --git-dir=_git --work-tree=. status --short --branch`

---

### Task 1: Add Bookshelf Markup and Responsive Styling

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add the settings-home entry**

Insert this button in `#settingsHomeView` next to the existing `句子库管理` entry:

```html
<button
  id="openBookshelfButton"
  type="button"
  class="flex w-full items-center justify-between rounded-[18px] border border-borderSoft/10 bg-surfaceSoft px-5 py-4 text-left transition hover:border-sage/35 hover:bg-sage/5 focus:outline-none focus:ring-4 focus:ring-sage/15"
>
  <span>
    <span class="block text-base font-semibold text-ink">书架</span>
    <span class="mt-1 block text-sm leading-6 text-muted">按书名整理摘录，并进入单本书回顾</span>
  </span>
  <span class="text-xl text-sage" aria-hidden="true">›</span>
</button>
```

- [ ] **Step 2: Add the bookshelf settings view**

Insert this view before `settingsLibraryView`:

```html
<div id="settingsBookshelfView" data-settings-view="bookshelf" class="hidden">
  <button
    type="button"
    data-settings-back
    class="mt-7 inline-flex items-center rounded-full border border-borderSoft/10 bg-surfaceSoft px-4 py-2 text-sm text-muted transition hover:border-sage/35 hover:text-sage focus:outline-none focus:ring-4 focus:ring-sage/15"
  >
    ← 返回设置
  </button>

  <section id="bookshelfListPanel" class="mt-6">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h3 class="text-base font-semibold text-ink">书架</h3>
        <p id="bookshelfCountText" class="mt-1 text-xs leading-5 text-muted">0 本书</p>
      </div>
      <span class="rounded-full bg-sage/10 px-3 py-1 text-xs text-sage">按书聚合</span>
    </div>
    <label class="mt-4 block">
      <span class="sr-only">搜索书架</span>
      <input
        id="bookshelfSearchInput"
        type="search"
        class="w-full rounded-[16px] border border-borderSoft/10 bg-surface px-4 py-3 text-sm text-ink outline-none transition focus:border-sage/45 focus:ring-4 focus:ring-sage/15"
        placeholder="搜索书名或作者"
      />
    </label>
    <div id="bookshelfSummaryGrid" class="mt-3 grid grid-cols-2 gap-3"></div>
    <div id="bookshelfList" class="mt-3 space-y-3"></div>
  </section>

  <section id="bookDetailPanel" class="mt-6 hidden">
    <button
      id="bookDetailBackButton"
      type="button"
      class="inline-flex items-center rounded-full border border-borderSoft/10 bg-surfaceSoft px-4 py-2 text-sm text-muted transition hover:border-sage/35 hover:text-sage focus:outline-none focus:ring-4 focus:ring-sage/15"
    >
      ← 返回书架
    </button>
    <div class="mt-4 rounded-[20px] border border-sage/15 bg-sage/5 p-4">
      <p class="text-xs text-muted">当前书籍</p>
      <h3 id="bookDetailTitle" class="mt-1 text-lg font-semibold leading-7 text-ink">未知书名</h3>
      <p id="bookDetailMeta" class="mt-1 text-sm leading-6 text-muted"></p>
      <div id="bookDetailSummaryGrid" class="mt-4 grid grid-cols-2 gap-3"></div>
      <button
        id="bookDetailReviewButton"
        type="button"
        class="mt-4 w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-paper transition hover:bg-ink/90 focus:outline-none focus:ring-4 focus:ring-sage/20"
      >
        只回顾这本书
      </button>
    </div>
    <div id="bookDetailNotes" class="mt-3 space-y-3"></div>
  </section>
</div>
```

- [ ] **Step 3: Add CSS**

Add these selectors to the existing CSS block near the existing card styles:

```css
.book-card,
.book-detail-note-card {
  border-color: var(--line-soft);
  background:
    linear-gradient(180deg, var(--surface-raised), var(--surface-inset));
  box-shadow: 0 14px 34px rgb(var(--color-border) / 0.055);
}

.book-spine {
  background: linear-gradient(180deg, rgb(var(--color-sage) / 0.18), rgb(var(--accent-warm) / 0.14));
}

.book-preview {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
```

Extend the mobile media query with:

```css
#bookshelfSummaryGrid,
#bookDetailSummaryGrid {
  gap: 0.65rem;
}

.book-card,
.book-detail-note-card {
  border-radius: 16px;
  padding: 0.85rem;
}

.book-card .book-actions,
.book-detail-note-card .book-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
```

- [ ] **Step 4: Verify markup exists**

Run: `rg -n "openBookshelfButton|settingsBookshelfView|bookshelfList|bookDetailPanel" index.html`

Expected: Four or more matching lines.

---

### Task 2: Add Bookshelf State, Helpers, and Rendering

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Wire new DOM elements**

Add these fields inside the existing `elements` object:

```js
openBookshelfButton: document.getElementById("openBookshelfButton"),
bookshelfListPanel: document.getElementById("bookshelfListPanel"),
bookDetailPanel: document.getElementById("bookDetailPanel"),
bookshelfSearchInput: document.getElementById("bookshelfSearchInput"),
bookshelfCountText: document.getElementById("bookshelfCountText"),
bookshelfSummaryGrid: document.getElementById("bookshelfSummaryGrid"),
bookshelfList: document.getElementById("bookshelfList"),
bookDetailBackButton: document.getElementById("bookDetailBackButton"),
bookDetailTitle: document.getElementById("bookDetailTitle"),
bookDetailMeta: document.getElementById("bookDetailMeta"),
bookDetailSummaryGrid: document.getElementById("bookDetailSummaryGrid"),
bookDetailReviewButton: document.getElementById("bookDetailReviewButton"),
bookDetailNotes: document.getElementById("bookDetailNotes"),
```

- [ ] **Step 2: Add bookshelf state**

Add these variables next to `reviewScope`:

```js
let activeBookKey = "";
let activeBookshelfKey = "";
```

- [ ] **Step 3: Add grouping helpers**

Add these functions after `getReviewPoolIndex(pool)`:

```js
function getBookTitle(note) {
  return cleanText(note?.book) || "未知书名";
}

function getBookAuthor(note) {
  return cleanText(note?.author);
}

function getBookKeyFromParts(book, author) {
  return `${cleanText(book).toLowerCase() || "未知书名"}::${cleanText(author).toLowerCase()}`;
}

function getBookKey(note) {
  return getBookKeyFromParts(getBookTitle(note), getBookAuthor(note));
}

function getBookSource(book, author) {
  return author ? `《${book}》${author}` : `《${book}》`;
}

function summarizeBookNotes(bookNotes) {
  return bookNotes.reduce((summary, note) => {
    const stats = readingStats.byNote.get(note.id);
    summary.favoriteCount += note.favorite ? 1 : 0;
    summary.totalDurationMs += stats?.totalDurationMs || 0;
    summary.viewCount += stats?.viewCount || 0;
    if (stats?.lastViewedAt && (!summary.lastViewedAt || stats.lastViewedAt > summary.lastViewedAt)) {
      summary.lastViewedAt = stats.lastViewedAt;
    }
    if (note.updatedAt && (!summary.lastUpdatedAt || note.updatedAt > summary.lastUpdatedAt)) {
      summary.lastUpdatedAt = note.updatedAt;
    }
    return summary;
  }, {
    favoriteCount: 0,
    totalDurationMs: 0,
    viewCount: 0,
    lastViewedAt: "",
    lastUpdatedAt: ""
  });
}

function getBookGroups() {
  const groups = new Map();
  notes.forEach((note) => {
    const book = getBookTitle(note);
    const author = getBookAuthor(note);
    const key = getBookKeyFromParts(book, author);
    if (!groups.has(key)) {
      groups.set(key, { key, book, author, notes: [] });
    }
    groups.get(key).notes.push(note);
  });

  return Array.from(groups.values()).map((group) => ({
    ...group,
    ...summarizeBookNotes(group.notes),
    noteCount: group.notes.length
  })).sort((a, b) => {
    const recentCompare = String(b.lastUpdatedAt).localeCompare(String(a.lastUpdatedAt));
    return recentCompare || a.book.localeCompare(b.book, "zh-Hans-CN");
  });
}

function getBookGroupByKey(bookKey) {
  return getBookGroups().find((group) => group.key === bookKey) || null;
}
```

- [ ] **Step 4: Add render helpers**

Add these functions after `renderLibrary()`:

```js
function renderBookshelfMetric(label, value, hint) {
  return `
    <div class="metric-card rounded-[16px] border border-borderSoft/10 bg-surfaceSoft p-3">
      <p class="text-[0.68rem] leading-4 text-muted">${escapeHtml(label)}</p>
      <p class="mt-1 text-lg font-semibold text-ink">${escapeHtml(value)}</p>
      <p class="mt-1 text-[0.68rem] leading-4 text-muted">${escapeHtml(hint)}</p>
    </div>
  `;
}

function renderBookshelf() {
  updateReadingStats();
  const query = cleanText(elements.bookshelfSearchInput.value).toLowerCase();
  const groups = getBookGroups();
  const visibleGroups = groups.filter((group) => {
    if (!query) {
      return true;
    }
    return `${group.book} ${group.author}`.toLowerCase().includes(query);
  });

  elements.bookshelfCountText.textContent = `${groups.length} 本书 · ${notes.length} 条摘录`;
  elements.bookshelfSummaryGrid.innerHTML = [
    renderBookshelfMetric("书籍", `${groups.length} 本`, "按书名与作者归并"),
    renderBookshelfMetric("摘录", `${notes.length} 条`, "当前句子库"),
    renderBookshelfMetric("收藏", `${notes.filter((note) => note.favorite).length} 条`, "星标摘录"),
    renderBookshelfMetric("阅读", formatShortDuration(readingStats.totalDurationMs), `${readingStats.totalViews} 次浏览`)
  ].join("");

  if (activeBookshelfKey && getBookGroupByKey(activeBookshelfKey)) {
    renderBookDetail(activeBookshelfKey);
    return;
  }

  activeBookshelfKey = "";
  elements.bookshelfListPanel.classList.remove("hidden");
  elements.bookDetailPanel.classList.add("hidden");

  if (!visibleGroups.length) {
    elements.bookshelfList.innerHTML = `
      <div class="rounded-[18px] border border-dashed border-sage/30 bg-surfaceSoft px-5 py-8 text-center text-sm leading-6 text-muted">
        没有匹配的书，可以换个关键词。
      </div>
    `;
    return;
  }

  elements.bookshelfList.innerHTML = visibleGroups.map((group) => {
    const source = getBookSource(group.book, group.author);
    const preview = group.notes[0]?.content || "";
    const lastViewed = group.lastViewedAt ? formatDateTime(group.lastViewedAt) : "尚未浏览";
    return `
      <article class="book-card rounded-[18px] border border-borderSoft/10 bg-surfaceSoft p-4 transition hover:border-sage/25">
        <div class="flex gap-3">
          <div class="book-spine h-16 w-3 shrink-0 rounded-full"></div>
          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h4 class="truncate text-base font-semibold text-ink">${escapeHtml(group.book)}</h4>
                <p class="mt-1 text-xs leading-5 text-muted">${escapeHtml(group.author || "作者未记录")}</p>
              </div>
              <span class="shrink-0 rounded-full bg-sage/10 px-3 py-1 text-xs text-sage">${group.noteCount} 条</span>
            </div>
            <p class="book-preview mt-3 text-sm leading-6 text-ink">${escapeHtml(preview)}</p>
            <p class="mt-2 text-xs leading-5 text-muted">${escapeHtml(source)} · 最近 ${escapeHtml(lastViewed)}</p>
            <div class="book-actions mt-3 flex flex-wrap gap-2">
              <button type="button" data-book-action="open" data-book-key="${escapeHtml(group.key)}" class="rounded-full border border-sage/25 px-4 py-2 text-sm text-sage transition hover:bg-sage/10 focus:outline-none focus:ring-4 focus:ring-sage/15">查看摘录</button>
              <button type="button" data-book-action="review" data-book-key="${escapeHtml(group.key)}" class="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper transition hover:bg-ink/90 focus:outline-none focus:ring-4 focus:ring-sage/20">回顾此书</button>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join("");
}
```

- [ ] **Step 5: Add detail renderer**

Add this function after `renderBookshelf()`:

```js
function renderBookDetail(bookKey) {
  const group = getBookGroupByKey(bookKey);
  if (!group) {
    activeBookshelfKey = "";
    renderBookshelf();
    return;
  }

  elements.bookshelfListPanel.classList.add("hidden");
  elements.bookDetailPanel.classList.remove("hidden");
  elements.bookDetailTitle.textContent = group.book;
  elements.bookDetailMeta.textContent = `${group.author || "作者未记录"} · ${group.noteCount} 条摘录`;
  elements.bookDetailSummaryGrid.innerHTML = [
    renderBookshelfMetric("摘录", `${group.noteCount} 条`, "这本书"),
    renderBookshelfMetric("收藏", `${group.favoriteCount} 条`, "星标摘录"),
    renderBookshelfMetric("停留", formatShortDuration(group.totalDurationMs), `${group.viewCount} 次浏览`),
    renderBookshelfMetric("最近", group.lastViewedAt ? formatDateTime(group.lastViewedAt) : "尚未浏览", "阅读记录")
  ].join("");

  elements.bookDetailNotes.innerHTML = group.notes.map((note) => {
    const stats = readingStats.byNote.get(note.id);
    const viewCount = stats?.viewCount || 0;
    const duration = stats?.totalDurationMs ? formatDuration(stats.totalDurationMs) : "0秒";
    const lastViewed = stats?.lastViewedAt ? formatDateTime(stats.lastViewedAt) : "尚未浏览";
    return `
      <article class="book-detail-note-card rounded-[18px] border border-borderSoft/10 bg-surfaceSoft p-4">
        <div class="flex items-start gap-3">
          <p class="min-w-0 flex-1 whitespace-pre-wrap text-sm leading-7 text-ink">${escapeHtml(note.content)}</p>
          <button type="button" data-book-note-action="favorite" data-note-id="${escapeHtml(note.id)}" class="shrink-0 rounded-full border border-sage/20 px-3 py-1.5 text-sm ${note.favorite ? "text-sage" : "text-muted"} transition hover:bg-sage/10 focus:outline-none focus:ring-4 focus:ring-sage/15" aria-pressed="${note.favorite}">${note.favorite ? "★" : "☆"}</button>
        </div>
        <p class="mt-3 text-xs leading-5 text-muted">累计停留 ${escapeHtml(duration)} · 浏览 ${viewCount} 次 · 最近 ${escapeHtml(lastViewed)}</p>
        <div class="book-actions mt-3 flex flex-wrap gap-2">
          <button type="button" data-book-note-action="edit" data-note-id="${escapeHtml(note.id)}" class="rounded-full border border-sage/25 px-4 py-2 text-sm text-sage transition hover:bg-sage/10 focus:outline-none focus:ring-4 focus:ring-sage/15">编辑</button>
          <button type="button" data-book-note-action="delete" data-note-id="${escapeHtml(note.id)}" class="rounded-full border border-clay/25 px-4 py-2 text-sm text-clay transition hover:bg-clay/10 focus:outline-none focus:ring-4 focus:ring-clay/15">删除</button>
        </div>
      </article>
    `;
  }).join("");
}
```

- [ ] **Step 6: Verify JavaScript syntax through the project check**

Run: `npm run verify`

Expected: check exits with code `0` and reports verification success.

---

### Task 3: Add Book-Scoped Review Interactions

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Extend review-pool behavior**

Replace `getReviewPool()` with:

```js
function getReviewPool() {
  if (reviewScope === "book") {
    const group = getBookGroupByKey(activeBookKey);
    if (group?.notes.length) {
      return group.notes;
    }

    reviewScope = "all";
    activeBookKey = "";
    setStatus("这本书暂时没有可回顾的摘录，已切回全部回顾。");
    updateReviewScopeButtons();
    return notes;
  }

  if (reviewScope !== "favorites") {
    return notes;
  }

  const favorites = notes.filter((note) => note.favorite);
  if (favorites.length) {
    return favorites;
  }

  reviewScope = "all";
  activeBookKey = "";
  setStatus("还没有收藏句子，已切回全部回顾。");
  updateReviewScopeButtons();
  return notes;
}
```

- [ ] **Step 2: Update count text for book mode**

Inside `updateNoteCounts()`, set `elements.countText.textContent` with this branch:

```js
if (reviewScope === "book") {
  const group = getBookGroupByKey(activeBookKey);
  const label = group ? `《${group.book}》 ${group.noteCount} 条 · 收藏 ${group.favoriteCount} 条` : `${notes.length} 条笔记 · ${favoriteCount} 条收藏`;
  elements.countText.textContent = label;
} else {
  elements.countText.textContent = reviewScope === "favorites"
    ? `收藏 ${favoriteCount} 条 · 共 ${notes.length} 条`
    : `${notes.length} 条笔记 · ${favoriteCount} 条收藏`;
}
```

- [ ] **Step 3: Add book-review starter**

Add this function near `showReviewView()`:

```js
async function startBookReview(bookKey) {
  const group = getBookGroupByKey(bookKey);
  if (!group?.notes.length) {
    setStatus("这本书暂时没有可回顾的摘录。");
    return;
  }

  reviewScope = "book";
  activeBookKey = bookKey;
  activeBookshelfKey = bookKey;
  elements.importView.classList.add("hidden");
  elements.reviewView.classList.remove("hidden");
  elements.settingsButton.classList.remove("hidden");
  elements.settingsButton.classList.add("flex");
  closeSettings();
  const currentBookNote = group.notes.find((note) => note.id === notes[currentIndex]?.id) || group.notes[0];
  await switchToNote(findNoteIndexById(currentBookNote.id), "book", "random");
  setStatus(`已进入《${group.book}》回顾。`);
}
```

- [ ] **Step 4: Clear book scope from normal scope buttons**

In the `elements.reviewScopeButtons` click handler, add:

```js
activeBookKey = "";
```

before assigning `reviewScope`.

- [ ] **Step 5: Refresh bookshelf from existing flows**

After existing `renderLibrary()` calls in flows that mutate notes or re-read remote state, call:

```js
renderBookshelf();
```

When a note is deleted, if `getBookGroupByKey(activeBookKey)` is empty, clear book scope:

```js
if (reviewScope === "book" && !getBookGroupByKey(activeBookKey)) {
  reviewScope = "all";
  activeBookKey = "";
}
```

- [ ] **Step 6: Add event listeners**

Add these listeners near the existing settings listeners:

```js
elements.openBookshelfButton.addEventListener("click", () => showSettingsView("bookshelf"));
elements.bookshelfSearchInput.addEventListener("input", renderBookshelf);
elements.bookDetailBackButton.addEventListener("click", () => {
  activeBookshelfKey = "";
  renderBookshelf();
});
elements.bookDetailReviewButton.addEventListener("click", () => {
  if (activeBookshelfKey) {
    startBookReview(activeBookshelfKey);
  }
});
elements.bookshelfList.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-book-action]");
  if (!actionButton) {
    return;
  }
  const bookKey = actionButton.dataset.bookKey;
  if (actionButton.dataset.bookAction === "open") {
    activeBookshelfKey = bookKey;
    renderBookshelf();
  }
  if (actionButton.dataset.bookAction === "review") {
    startBookReview(bookKey);
  }
});
elements.bookDetailNotes.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-book-note-action]");
  if (!actionButton) {
    return;
  }
  const noteId = actionButton.dataset.noteId;
  if (actionButton.dataset.bookNoteAction === "edit") {
    fillNoteForm(noteId);
    showSettingsView("library");
  }
  if (actionButton.dataset.bookNoteAction === "delete") {
    deleteNote(noteId);
  }
  if (actionButton.dataset.bookNoteAction === "favorite") {
    toggleFavorite(noteId);
  }
});
```

- [ ] **Step 7: Verify feature hooks**

Run: `rg -n "reviewScope === \"book\"|startBookReview|renderBookshelf|bookDetailNotes" index.html`

Expected: Each pattern appears at least once.

---

### Task 4: GitHub SSH Stabilization

**Files:**
- Create: `docs/github-ssh-setup.md`

- [ ] **Step 1: Save practical setup notes**

Create `docs/github-ssh-setup.md` with:

```markdown
# GitHub SSH 推送配置

当前仓库地址：`yiqinxuantlt/Codex`

## 为什么建议改用 SSH

HTTPS 推送依赖 Git Credential Manager 和系统凭据。当前机器出现过 `SEC_E_NO_CREDENTIALS` 与非交互推送卡住的问题，说明凭据读取不稳定。SSH 用本机私钥认证，配置成功后推送更稳定。

## 本机配置步骤

1. 生成 SSH key：
   `ssh-keygen -t ed25519 -C "yiqinxuantlt GitHub" -f "$env:USERPROFILE\.ssh\id_ed25519_github" -N ""`
2. 打开公钥：
   `Get-Content "$env:USERPROFILE\.ssh\id_ed25519_github.pub"`
3. 在 GitHub 打开 `Settings → SSH and GPG keys → New SSH key`，粘贴上一步的公钥。
4. 测试连接：
   `ssh -T git@github.com`
5. 将当前仓库远程地址切换到 SSH：
   `git --git-dir=_git --work-tree=. remote set-url origin git@github.com:yiqinxuantlt/Codex.git`
6. 推送：
   `git --git-dir=_git --work-tree=. push origin main`
```

- [ ] **Step 2: Preserve HTTPS fallback**

Keep the repo-local HTTPS improvement already set:

```powershell
git --git-dir=_git --work-tree=. config http.sslBackend openssl
```

- [ ] **Step 3: Generate SSH key if missing**

Check:

```powershell
Test-Path "$env:USERPROFILE\.ssh\id_ed25519_github.pub"
```

If it returns `False`, create the key with the command from Step 1. Do not print or copy the private key.

- [ ] **Step 4: Do not switch remote before the public key is registered**

If `ssh -T git@github.com` does not authenticate successfully, keep `origin` on HTTPS and tell the user to add the public key to GitHub. If authentication succeeds, set:

```powershell
git --git-dir=_git --work-tree=. remote set-url origin git@github.com:yiqinxuantlt/Codex.git
```

- [ ] **Step 5: Verify current remote**

Run:

```powershell
git --git-dir=_git --work-tree=. remote -v
```

Expected before SSH key registration: HTTPS remote remains. Expected after successful SSH auth: SSH remote is shown for fetch and push.

---

### Task 5: Final Verification, Commit, and Sync

**Files:**
- Modify: `index.html`
- Create: `docs/github-ssh-setup.md`

- [ ] **Step 1: Run app verification**

Run:

```powershell
npm run verify
```

Expected: exit code `0`.

- [ ] **Step 2: Refresh Android web assets**

Run:

```powershell
npm run cap:copy
```

Expected: exit code `0`.

- [ ] **Step 3: Review changed files**

Run:

```powershell
git --git-dir=_git --work-tree=. diff --stat
git --git-dir=_git --work-tree=. diff -- index.html docs/github-ssh-setup.md
```

Expected: only bookshelf UI/code, GitHub SSH documentation, and generated Android copy output if Capacitor updates it.

- [ ] **Step 4: Commit**

Run:

```powershell
git --git-dir=_git --work-tree=. add index.html docs/github-ssh-setup.md
git --git-dir=_git --work-tree=. commit -m "feat: add bookshelf review mode"
```

Expected: commit created on `main`.

- [ ] **Step 5: Push**

Run:

```powershell
git --git-dir=_git --work-tree=. push origin main
```

Expected with valid GitHub credentials or SSH: push succeeds. If it fails because GitHub authentication is not registered, leave the commit local and report the exact next user action.

---

## Self-Review

- Spec coverage: The plan adds a bookshelf entry, dynamic book grouping, book details, book-scoped review, mobile-compact styling, no IndexedDB migration, and GitHub SSH stabilization with HTTPS fallback.
- Placeholder scan: No task uses placeholder language; each code step includes concrete markup, JavaScript, CSS, or exact commands.
- Type consistency: State names are `activeBookKey`, `activeBookshelfKey`, helper names consistently use `Book`, and DOM ids match the markup.
