# Bookshelf And GitHub SSH Design

## Context

The app is a single-file reading-note reviewer with IndexedDB persistence, CSV import, note management, reading records, local backups, LAN sync, PWA assets, and Android packaging. Each note already stores `content`, `book`, `author`, `chapter`, `remark`, `favorite`, `createdAt`, and `updatedAt`. The confirmed visual direction for the new bookshelf is **A + light C**: keep the entrance inside the settings drawer, but give the bookshelf view its own book-oriented visual hierarchy.

Git currently uses the HTTPS remote `https://github.com/yiqinxuantlt/Codex.git`. This depends on Git Credential Manager and the Windows HTTPS backend. Pushes have intermittently failed with `SEC_E_NO_CREDENTIALS`, which points to the local credential/TLS handoff rather than a repository or code problem.

## Goals

- Add a bookshelf feature that groups excerpts from the same book in one place.
- Let the user open a book and browse all excerpts from that book.
- Add a clear “review only this book” action.
- Preserve the existing immersive reading page, mobile polish, local backup, sync, and APK behavior.
- Stabilize GitHub pushing by moving the repository remote to SSH after an SSH key is available.

## Non-Goals

- Do not add a new IndexedDB store or migrate the database version.
- Do not fetch book metadata, covers, ISBNs, or online images.
- Do not create a separate route or multi-file frontend.
- Do not change LAN sync or backup schema.
- Do not store GitHub tokens in the project.

## Bookshelf Data Model

Books are computed from the existing `notes` array at render time.

Book identity:

```text
normalized book name + normalized author
```

Rules:

- Trim whitespace from `book` and `author`.
- Treat an empty book name as `未知书名`.
- Treat an empty author as an empty string.
- The display source remains consistent with existing behavior: `《书名》作者` when author exists, otherwise `《书名》`.
- Sort books by note count descending, then by last updated time descending, then by book title.

Each computed book group exposes:

- `key`
- `book`
- `author`
- `notes`
- `noteCount`
- `favoriteCount`
- `lastUpdatedAt`
- `totalDurationMs`
- `viewCount`

Reading statistics come from the existing reading-events aggregation when available. If no events exist for a book, the book still appears with zero reading time.

## UI Design

### Entry Point

Add a new settings home button named `书架`, placed near `句子库管理`. It uses the same card style as the existing settings menu items and keeps the reading page free of extra floating buttons.

### Bookshelf View

Add a new settings subview:

```html
<div id="settingsBookshelfView" data-settings-view="bookshelf" class="hidden">
```

Layout:

- Header row with back button, title `书架`, and total book count.
- Search input for book title or author.
- A compact summary strip showing total books, total excerpts, favorite excerpts, and books with reading records.
- A list of book cards.

Book card content:

- Book title and author.
- Excerpt count and favorite count.
- Last updated or last viewed time.
- A short preview of one recent excerpt.
- Actions:
  - `查看摘录`
  - `只回顾这本书`

The visual style should feel like a quiet shelf rather than a management table: paper cards, soft separators, compact metrics, and restrained night-mode contrast.

### Book Detail View

Reuse the bookshelf subview rather than adding a separate route. When the user selects a book, the same view changes into a detail mode:

- Back control returns to the full bookshelf list.
- Header shows `《书名》作者`.
- Summary shows this book’s excerpt count, favorites, total reading time, and view count.
- List all notes for the book.
- Each note row supports:
  - Preview content.
  - Source metadata.
  - Favorite toggle.
  - Edit.
  - Delete.
  - Expand full content/details.
- Primary action: `只回顾这本书`.

Editing and deleting call the existing note-management functions so persistence, backup, sync, and reading records remain consistent.

## Review Scope Behavior

Current review scope supports `all` and `favorites`. Add a third transient scope:

```js
reviewScope = "book";
activeBookKey = "";
```

Behavior:

- `getReviewPool()` returns notes in the active book when `reviewScope === "book"`.
- If the active book becomes empty after edits/deletes, the app falls back to `all`.
- The count text should show `《书名》 N 条 · M 条收藏` while in book scope.
- The reading page scope controls may remain `全部 / 收藏`; selecting either clears book scope.
- A lightweight status message confirms when book review mode starts.

This avoids a database migration and keeps the scope as UI state only.

## JavaScript Functions

Add helpers:

- `normalizeBookValue(value, fallback)`
- `getBookKey(note)`
- `getBookSourceFromParts(book, author)`
- `getBookGroups()`
- `getBookGroupByKey(bookKey)`
- `renderBookshelf()`
- `renderBookDetail(bookKey)`
- `startBookReview(bookKey)`
- `clearBookReviewScope()`

Modify existing functions:

- `elements`: add bookshelf buttons, containers, and search input.
- `showSettingsView(viewName)`: render bookshelf when `viewName === "bookshelf"`.
- `getReviewPool()`: include book scope.
- `updateNoteCounts()`: reflect active book scope in `countText`.
- `refreshAfterLibraryChange()`, `toggleFavorite()`, and `deleteNote()`: refresh bookshelf when needed.
- Event listeners: add settings-home bookshelf button, bookshelf search, and delegated book/note actions.

## Mobile Behavior

- Settings drawer remains the host surface for the bookshelf.
- Book cards use one-column layout on mobile.
- Metrics wrap into two columns on narrow screens.
- Touch targets stay at least 44px tall.
- Long note previews clamp to two lines, with details expandable.
- No horizontal scrolling.

## GitHub SSH Stabilization

The stable path is to stop relying on HTTPS credential prompts and move the remote to SSH:

```powershell
ssh-keygen -t ed25519 -C "yiqinxuantlt GitHub" -f "$env:USERPROFILE\.ssh\id_ed25519_github"
Get-Content "$env:USERPROFILE\.ssh\id_ed25519_github.pub"
git --git-dir=_git --work-tree=. remote set-url origin git@github.com:yiqinxuantlt/Codex.git
ssh -T git@github.com
git --git-dir=_git --work-tree=. push origin main
```

The public key must be added to GitHub under **Settings → SSH and GPG keys → New SSH key**. The private key remains local. If GitHub SSH already has a key, reuse it instead of creating a duplicate.

Keep the repository-local `http.sslBackend=openssl` setting as a harmless fallback for HTTPS operations, but SSH becomes the primary push path.

## Verification

Run:

```powershell
npm.cmd run verify
npm.cmd run cap:copy
git --git-dir=_git --work-tree=. status --short --branch
```

Manual checks:

- Import or use existing notes containing multiple entries from the same book.
- Open settings → bookshelf.
- Confirm books are grouped by title and author.
- Open one book and verify all its excerpts appear.
- Use `只回顾这本书`, then random/next/previous review stays inside that book.
- Toggle favorite, edit, and delete from book detail; confirm the bookshelf updates.
- Confirm mobile drawer and book cards have no horizontal scroll.
- Confirm `git push origin main` works over SSH after GitHub key setup.
