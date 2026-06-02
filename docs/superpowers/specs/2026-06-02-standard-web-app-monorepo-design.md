# Standard Web App Monorepo Design

## Purpose

把当前读书笔记应用升级为标准 Web App 架构：

- 前端使用 React + Vite。
- 后端使用 Java Spring Boot。
- 数据库使用 PostgreSQL。
- 仓库采用 Monorepo 结构。
- 第一版面向单用户个人使用。
- 旧数据只支持通过 CSV 重新导入，不迁移 IndexedDB、旧阅读记录、旧主题或旧字体。

这不是继续微调现有静态网页，而是建立一个可长期维护、可部署、可扩展的标准 Web 应用地基。

## Current Context

当前仓库已经完成轻量拆分：

```text
index.html
src/
server/
sync-server.js
android/
tools/
```

其中：

- `src/app.js` 仍是当前旧版前端的主要浏览器逻辑。
- `server/` 是轻量 Node 局域网同步服务。
- `android/` 是后续 APK 路线的既有工程。

新标准 Web App 不直接改造 `src/app.js` 和 `server/`，而是在 Monorepo 中新增独立的 `frontend/` 与 `backend/`。旧版静态应用保留为参考和临时可用版本。

## Selected Direction

用户已确认以下边界：

- 架构：Monorepo 标准 Web App。
- 前端：React + Vite。
- 后端：Java Spring Boot。
- 数据库：PostgreSQL。
- 用户模式：单用户个人版。
- 数据迁移：只支持 CSV 重新导入。
- APK：第一版先不做，Web App 稳定后再补。
- 第一版功能：核心功能版。

## Non-Goals

第一版不做：

- 用户注册、登录、多用户权限。
- 旧 IndexedDB 自动迁移。
- 旧阅读记录自动迁移。
- 本地字体导入。
- 完整备份恢复中心。
- APK / Capacitor 重新接入。
- GitHub Pages 静态部署。
- 离线优先 IndexedDB 本地数据库。
- 多设备冲突合并。
- 云端文件存储。

## Monorepo Structure

新增标准结构：

```text
frontend/
  package.json
  index.html
  vite.config.ts
  tsconfig.json
  src/
    main.tsx
    App.tsx
    api/
    components/
    features/
      review/
      bookshelf/
      import/
      records/
      settings/
    styles/

backend/
  pom.xml
  src/main/java/com/tianlutao/readingreview/
    ReadingReviewApplication.java
    config/
    controller/
    service/
    repository/
    domain/
    dto/
    exception/
  src/main/resources/
    application.yml
    db/migration/
  src/test/java/com/tianlutao/readingreview/

infra/
  docker-compose.yml
  postgres/

docs/
  superpowers/

legacy/
  README.md
```

Implementation can choose whether to move the current vanilla app into `legacy/` immediately or leave it at repository root during the transition. The first implementation should not delete the old app until the React/Spring version is verified.

## Frontend Design

### Technology

- React.
- Vite.
- TypeScript.
- React Router for top-level routes.
- Plain CSS or CSS Modules for first version.
- Fetch-based API client.

The UI should preserve the current calm reading style: paper-like surfaces, quiet typography, restrained controls, and a strong mobile reading experience.

### Routes

```text
/                 Random review
/import           CSV import
/books            Bookshelf
/books/:bookId    Book detail
/records          Reading records
/settings         Theme settings
```

### Feature Scope

First version includes:

- CSV import.
- Random note review.
- Previous / next controls.
- Favorite / unfavorite note.
- Bookshelf grouped by book and author.
- Book detail view with all excerpts for that book.
- Reading events with view count and total dwell time.
- Theme switching: paper and night themes.

First version excludes:

- Local font upload.
- Full backup and restore.
- Reading record charts beyond simple summary.
- APK-specific behavior.
- Offline local database.

### Frontend State

Frontend state should be server-backed:

- Notes come from backend API.
- Bookshelf comes from backend API aggregation or backend book endpoints.
- Favorite state persists through backend API.
- Reading events are posted to backend.
- Theme selection can remain in browser `localStorage` for first version, because it is presentation-only and single-user.

## Backend Design

### Technology

- Java 17+.
- Spring Boot 3.x.
- Spring Web.
- Spring Data JPA.
- PostgreSQL driver.
- Flyway for schema migrations.
- Maven build.
- JUnit 5 for tests.

### Java Standards

Apply the Java coding standards:

- Constructor injection only.
- No field injection.
- DTOs use Java `record` where practical.
- Domain entities have clear names and minimal mutable surface.
- Services keep business logic; controllers stay thin.
- Repositories return `Optional` for find-by-id style methods.
- Exceptions are domain-specific and handled centrally.
- Package layout follows Spring conventions:

```text
controller/
service/
repository/
domain/
dto/
config/
exception/
```

### Package

Use:

```text
com.tianlutao.readingreview
```

### Core Domain

#### Book

Represents a unique book and author pair.

Fields:

- `id`
- `title`
- `author`
- `createdAt`
- `updatedAt`

Uniqueness:

- Normalize title and author for lookup.
- Avoid duplicate books when importing CSV.

#### Note

Represents one excerpt.

Fields:

- `id`
- `book`
- `content`
- `chapter`
- `remark`
- `favorite`
- `createdAt`
- `updatedAt`

#### ReadingEvent

Represents one dwell-time record.

Fields:

- `id`
- `note`
- `startedAt`
- `endedAt`
- `durationMs`
- `source`

### PostgreSQL Schema

Use Flyway migration `V1__init.sql`.

Tables:

```text
books
notes
reading_events
```

Suggested constraints:

- `books.title` not null.
- `notes.content` not null.
- `notes.book_id` references `books(id)`.
- `reading_events.note_id` references `notes(id)` with delete cascade.
- Index `notes.book_id`.
- Index `notes.favorite`.
- Index `reading_events.note_id`.
- Index `reading_events.ended_at`.

## API Design

All APIs are under `/api`.

### Notes

```text
GET    /api/notes
GET    /api/notes/random
GET    /api/notes/{id}
PATCH  /api/notes/{id}/favorite
DELETE /api/notes/{id}
```

### Books

```text
GET /api/books
GET /api/books/{id}
GET /api/books/{id}/notes
GET /api/books/{id}/random-note
```

### CSV Import

```text
POST /api/import/csv
```

Accepts multipart file upload. Backend parses CSV and creates books/notes. The importer recognizes these headers:

- `书名`
- `作者`
- `章节名称`
- `笔记内容`
- `备注`

Rows without valid `笔记内容` are ignored.

### Reading Records

```text
POST /api/reading-events
GET  /api/reading-records/summary
GET  /api/reading-records/notes
```

### Health

```text
GET /api/health
```

## CSV Import Behavior

CSV import is the only migration path for first version.

Rules:

- Import runs on the backend.
- Notes are created from rows with non-empty `笔记内容`.
- Missing `书名` becomes `未知书名`.
- Missing `作者` is allowed.
- Existing books are reused by normalized title and author.
- Duplicate note detection is optional in first version; exact duplicates may be allowed unless implementation chooses a safe dedupe rule.

## Data Flow

### Import Flow

1. User opens `/import`.
2. Frontend selects CSV file.
3. Frontend posts file to `/api/import/csv`.
4. Backend parses CSV.
5. Backend writes `books` and `notes`.
6. Frontend shows import summary and links to review/bookshelf.

### Review Flow

1. Frontend requests `/api/notes/random`.
2. User reads note.
3. When switching away, frontend posts a reading event.
4. Next/previous can be handled by frontend list state or backend endpoints. First version may fetch all notes and navigate client-side after initial load.

### Bookshelf Flow

1. Frontend requests `/api/books`.
2. Backend returns book summaries with note count, favorite count, and reading totals.
3. Frontend opens `/books/:bookId`.
4. Frontend requests `/api/books/{id}/notes`.

## Error Handling

Backend:

- Bad CSV returns `400` with clear message.
- Missing note/book returns `404`.
- Unexpected errors return `500` through central exception handler.
- Controllers do not expose stack traces.

Frontend:

- Import errors show inline status.
- API unavailable shows a calm error screen with retry.
- Empty note library routes user to import page.

## Development Workflow

Root scripts can later be added:

```text
npm run dev:frontend
npm run dev:backend
npm run dev
```

For first implementation, direct commands are acceptable:

```powershell
cd frontend
npm.cmd run dev

cd backend
mvn spring-boot:run
```

PostgreSQL can run through `infra/docker-compose.yml`.

## Testing Strategy

Backend:

- Unit tests for CSV import service.
- Unit tests for book reuse / grouping.
- Controller tests for core APIs.
- Repository integration tests can be added once database setup is stable.

Frontend:

- Component tests are optional in first scaffold.
- Prioritize functional smoke checks:
  - Import page renders.
  - Review page handles empty state.
  - Bookshelf page renders API data.

End-to-end:

- First version can rely on manual/browser smoke checks.
- Later add Playwright for import/review/bookshelf flow.

## Compatibility With Existing Project

Existing static app remains available during the migration. The new app should not delete:

- Current `index.html`.
- Current `src/`.
- Current `server/`.
- Current `android/`.

After the standard Web App is stable, a later cleanup can decide whether to move the old app under `legacy/` or keep it as a reference.

## Acceptance Criteria

The design is complete when future implementation can:

1. Scaffold `frontend/` React/Vite TypeScript app.
2. Scaffold `backend/` Spring Boot app.
3. Start PostgreSQL through `infra/docker-compose.yml`.
4. Create Flyway schema for `books`, `notes`, and `reading_events`.
5. Import CSV through backend endpoint.
6. Show imported notes in React review page.
7. Show books grouped by book and author.
8. Record dwell time through backend.
9. Switch between paper and night themes.
10. Leave existing static app intact.

## Self Review

- Placeholder scan: no placeholder or undefined requirement remains.
- Internal consistency: chosen stack, scope, migration policy, and non-goals match the user's confirmed choices.
- Scope check: first implementation is large but cohesive; it should be planned in phases: scaffold backend/database, scaffold frontend, migrate core features, verify.
- Ambiguity check: old-data migration, APK, auth, and first-version feature scope are explicit.
