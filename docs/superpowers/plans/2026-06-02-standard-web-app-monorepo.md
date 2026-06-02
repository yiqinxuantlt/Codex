# Standard Web App Monorepo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standard monorepo Web App version of the reading note reviewer with React/Vite frontend, Spring Boot backend, and PostgreSQL persistence.

**Architecture:** Keep the existing static app intact while adding `frontend/`, `backend/`, and `infra/`. The backend owns PostgreSQL data, CSV import, note/book/reading APIs, and domain logic. The frontend is a React/Vite TypeScript app that consumes REST APIs and implements the core reading workflow.

**Tech Stack:** React, Vite, TypeScript, Java 17+, Spring Boot 3.x, Spring Web, Spring Data JPA, Flyway, PostgreSQL, Docker Compose, Maven, JUnit 5.

---

## File Structure

- Create `frontend/`
  - React/Vite TypeScript app.
  - `src/api/` for REST client.
  - `src/features/` for import, review, bookshelf, records, and settings.
  - `src/styles/` for calm paper/night theme CSS.
- Create `backend/`
  - Spring Boot app under `com.tianlutao.readingreview`.
  - `controller`, `service`, `repository`, `domain`, `dto`, `exception`, `config`.
  - Flyway migration under `src/main/resources/db/migration/`.
- Create `infra/docker-compose.yml`
  - Local PostgreSQL service.
- Modify root `package.json`
  - Add helper scripts that delegate to frontend and backend.
- Modify `README.md`
  - Document standard Web App startup.
- Leave existing `index.html`, `src/`, `server/`, and `android/` untouched unless documentation references are added.

---

### Task 1: Monorepo Infrastructure

**Files:**
- Create: `infra/docker-compose.yml`
- Modify: `package.json`
- Modify: `README.md`

- [ ] **Step 1: Create PostgreSQL Compose config**

Create `infra/docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:16
    container_name: reading-review-postgres
    environment:
      POSTGRES_DB: reading_review
      POSTGRES_USER: reading_review
      POSTGRES_PASSWORD: reading_review
    ports:
      - "5432:5432"
    volumes:
      - reading_review_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U reading_review -d reading_review"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  reading_review_pgdata:
```

- [ ] **Step 2: Add root helper scripts**

Modify root `package.json` scripts to include:

```json
"dev:frontend": "npm --prefix frontend run dev",
"dev:backend": "cd backend && mvn spring-boot:run",
"db:up": "docker compose -f infra/docker-compose.yml up -d",
"db:down": "docker compose -f infra/docker-compose.yml down",
"verify:webapp": "npm --prefix frontend run build && cd backend && mvn test"
```

Keep the existing Android and legacy verification scripts.

- [ ] **Step 3: Add README startup section**

Add a section titled `标准 Web App 开发`:

```markdown
## 标准 Web App 开发

新版本采用 Monorepo：

- `frontend/`：React + Vite + TypeScript
- `backend/`：Spring Boot + PostgreSQL
- `infra/`：本地 PostgreSQL Docker Compose

启动顺序：

```powershell
npm.cmd run db:up
cd backend
mvn spring-boot:run
cd ..\frontend
npm.cmd run dev
```

旧版静态应用仍保留在仓库根目录，可继续作为参考。
```

- [ ] **Step 4: Verify Docker config syntax**

Run:

```powershell
docker compose -f infra/docker-compose.yml config
```

Expected: Docker Compose prints normalized config. If Docker is not installed, record that database runtime verification is blocked locally and continue with file-level checks.

---

### Task 2: Backend Scaffold and Configuration

**Files:**
- Create: `backend/pom.xml`
- Create: `backend/src/main/java/com/tianlutao/readingreview/ReadingReviewApplication.java`
- Create: `backend/src/main/resources/application.yml`
- Create: `backend/src/test/java/com/tianlutao/readingreview/ReadingReviewApplicationTests.java`

- [ ] **Step 1: Create Maven build**

Create `backend/pom.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.3.7</version>
    <relativePath/>
  </parent>

  <groupId>com.tianlutao</groupId>
  <artifactId>reading-review-backend</artifactId>
  <version>0.1.0</version>
  <name>reading-review-backend</name>
  <description>Spring Boot backend for the reading note reviewer.</description>

  <properties>
    <java.version>17</java.version>
  </properties>

  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    <dependency>
      <groupId>org.flywaydb</groupId>
      <artifactId>flyway-core</artifactId>
    </dependency>
    <dependency>
      <groupId>org.flywaydb</groupId>
      <artifactId>flyway-database-postgresql</artifactId>
    </dependency>
    <dependency>
      <groupId>org.postgresql</groupId>
      <artifactId>postgresql</artifactId>
      <scope>runtime</scope>
    </dependency>
    <dependency>
      <groupId>org.apache.commons</groupId>
      <artifactId>commons-csv</artifactId>
      <version>1.11.0</version>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-test</artifactId>
      <scope>test</scope>
    </dependency>
  </dependencies>

  <build>
    <plugins>
      <plugin>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-maven-plugin</artifactId>
      </plugin>
    </plugins>
  </build>
</project>
```

- [ ] **Step 2: Create Spring Boot entrypoint**

Create `backend/src/main/java/com/tianlutao/readingreview/ReadingReviewApplication.java`:

```java
package com.tianlutao.readingreview;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ReadingReviewApplication {
  public static void main(String[] args) {
    SpringApplication.run(ReadingReviewApplication.class, args);
  }
}
```

- [ ] **Step 3: Configure PostgreSQL and Flyway**

Create `backend/src/main/resources/application.yml`:

```yaml
server:
  port: 8080

spring:
  datasource:
    url: ${READING_REVIEW_DB_URL:jdbc:postgresql://localhost:5432/reading_review}
    username: ${READING_REVIEW_DB_USER:reading_review}
    password: ${READING_REVIEW_DB_PASSWORD:reading_review}
  jpa:
    hibernate:
      ddl-auto: validate
    open-in-view: false
    properties:
      hibernate:
        jdbc:
          time_zone: UTC
  flyway:
    enabled: true

app:
  cors:
    allowed-origins:
      - http://localhost:5173
      - http://127.0.0.1:5173
```

- [ ] **Step 4: Add context smoke test**

Create `backend/src/test/java/com/tianlutao/readingreview/ReadingReviewApplicationTests.java`:

```java
package com.tianlutao.readingreview;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class ReadingReviewApplicationTests {
  @Test
  void contextLoads() {
  }
}
```

- [ ] **Step 5: Run Maven tests**

Run:

```powershell
cd backend
mvn test
```

Expected: initial test may fail if PostgreSQL is not running. After `npm.cmd run db:up`, expected result is Maven test success.

---

### Task 3: Backend Domain, Schema, and Repositories

**Files:**
- Create: `backend/src/main/resources/db/migration/V1__init.sql`
- Create: `backend/src/main/java/com/tianlutao/readingreview/domain/Book.java`
- Create: `backend/src/main/java/com/tianlutao/readingreview/domain/Note.java`
- Create: `backend/src/main/java/com/tianlutao/readingreview/domain/ReadingEvent.java`
- Create: `backend/src/main/java/com/tianlutao/readingreview/repository/BookRepository.java`
- Create: `backend/src/main/java/com/tianlutao/readingreview/repository/NoteRepository.java`
- Create: `backend/src/main/java/com/tianlutao/readingreview/repository/ReadingEventRepository.java`

- [ ] **Step 1: Create Flyway migration**

Create `backend/src/main/resources/db/migration/V1__init.sql`:

```sql
create table books (
  id bigserial primary key,
  title varchar(255) not null,
  author varchar(255),
  normalized_title varchar(255) not null,
  normalized_author varchar(255) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uk_books_normalized unique (normalized_title, normalized_author)
);

create table notes (
  id bigserial primary key,
  book_id bigint not null references books(id),
  content text not null,
  chapter varchar(512),
  remark text,
  favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table reading_events (
  id bigserial primary key,
  note_id bigint not null references notes(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_ms bigint not null,
  source varchar(64) not null
);

create index idx_notes_book_id on notes(book_id);
create index idx_notes_favorite on notes(favorite);
create index idx_reading_events_note_id on reading_events(note_id);
create index idx_reading_events_ended_at on reading_events(ended_at);
```

- [ ] **Step 2: Create entities**

Create `Book`, `Note`, and `ReadingEvent` with:

```java
@Entity
@Table(name = "books", uniqueConstraints = @UniqueConstraint(name = "uk_books_normalized", columnNames = {"normalized_title", "normalized_author"}))
public class Book {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String title;

  private String author;

  @Column(name = "normalized_title", nullable = false)
  private String normalizedTitle;

  @Column(name = "normalized_author", nullable = false)
  private String normalizedAuthor;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected Book() {
  }

  public Book(String title, String author, String normalizedTitle, String normalizedAuthor, Instant now) {
    this.title = title;
    this.author = author;
    this.normalizedTitle = normalizedTitle;
    this.normalizedAuthor = normalizedAuthor;
    this.createdAt = now;
    this.updatedAt = now;
  }

  public Long getId() { return id; }
  public String getTitle() { return title; }
  public String getAuthor() { return author; }
  public String getNormalizedTitle() { return normalizedTitle; }
  public String getNormalizedAuthor() { return normalizedAuthor; }
  public Instant getCreatedAt() { return createdAt; }
  public Instant getUpdatedAt() { return updatedAt; }
}
```

Implement `Note` with a `@ManyToOne(fetch = FetchType.LAZY)` `Book book`, content/chapter/remark/favorite timestamps, getters, `toggleFavorite()`, and `touch(Instant now)`.

Implement `ReadingEvent` with a `@ManyToOne(fetch = FetchType.LAZY)` `Note note`, `startedAt`, `endedAt`, `durationMs`, `source`, and getters.

- [ ] **Step 3: Create repositories**

Create repositories:

```java
public interface BookRepository extends JpaRepository<Book, Long> {
  Optional<Book> findByNormalizedTitleAndNormalizedAuthor(String normalizedTitle, String normalizedAuthor);
}
```

```java
public interface NoteRepository extends JpaRepository<Note, Long> {
  List<Note> findAllByOrderByCreatedAtAsc();
  List<Note> findByBookIdOrderByCreatedAtAsc(Long bookId);
  List<Note> findByFavoriteTrueOrderByCreatedAtAsc();
}
```

```java
public interface ReadingEventRepository extends JpaRepository<ReadingEvent, Long> {
  List<ReadingEvent> findByNoteIdOrderByEndedAtDesc(Long noteId);
}
```

- [ ] **Step 4: Run backend tests**

Run:

```powershell
cd backend
mvn test
```

Expected: Flyway migration and JPA validation succeed when PostgreSQL is running.

---

### Task 4: Backend DTOs, Services, and Controllers

**Files:**
- Create DTO records under `backend/src/main/java/com/tianlutao/readingreview/dto/`
- Create services under `backend/src/main/java/com/tianlutao/readingreview/service/`
- Create controllers under `backend/src/main/java/com/tianlutao/readingreview/controller/`
- Create exceptions under `backend/src/main/java/com/tianlutao/readingreview/exception/`

- [ ] **Step 1: Create DTO records**

Create records:

```java
public record NoteResponse(
    Long id,
    Long bookId,
    String bookTitle,
    String author,
    String content,
    String chapter,
    String remark,
    boolean favorite,
    Instant createdAt,
    Instant updatedAt
) {}
```

```java
public record BookSummaryResponse(
    Long id,
    String title,
    String author,
    long noteCount,
    long favoriteCount,
    long totalDurationMs,
    long viewCount
) {}
```

```java
public record CsvImportResponse(int importedNotes, int skippedRows, int bookCount) {}
```

```java
public record ReadingEventRequest(Long noteId, Instant startedAt, Instant endedAt, long durationMs, String source) {}
```

```java
public record ReadingSummaryResponse(long totalDurationMs, long totalViews, long noteCount, long favoriteCount) {}
```

- [ ] **Step 2: Create exception handling**

Create:

```java
public class ResourceNotFoundException extends RuntimeException {
  public ResourceNotFoundException(String message) {
    super(message);
  }
}
```

Create `GlobalExceptionHandler` with `@RestControllerAdvice` that maps:

- `ResourceNotFoundException` to 404.
- `IllegalArgumentException` to 400.
- all other exceptions to 500.

Use an `ErrorResponse` record:

```java
public record ErrorResponse(String error, String message) {}
```

- [ ] **Step 3: Create `BookService`**

Implement:

```java
@Service
public class BookService {
  private final BookRepository bookRepository;
  private final NoteRepository noteRepository;
  private final ReadingEventRepository readingEventRepository;

  public BookService(BookRepository bookRepository, NoteRepository noteRepository, ReadingEventRepository readingEventRepository) {
    this.bookRepository = bookRepository;
    this.noteRepository = noteRepository;
    this.readingEventRepository = readingEventRepository;
  }

  public Book findOrCreate(String title, String author) {
    String cleanTitle = clean(title).isBlank() ? "未知书名" : clean(title);
    String cleanAuthor = clean(author);
    String normalizedTitle = normalize(cleanTitle);
    String normalizedAuthor = normalize(cleanAuthor);
    return bookRepository.findByNormalizedTitleAndNormalizedAuthor(normalizedTitle, normalizedAuthor)
        .orElseGet(() -> bookRepository.save(new Book(cleanTitle, cleanAuthor, normalizedTitle, normalizedAuthor, Instant.now())));
  }

  private String clean(String value) {
    return value == null ? "" : value.replace("\uFEFF", "").trim();
  }

  private String normalize(String value) {
    return clean(value).toLowerCase(Locale.ROOT);
  }
}
```

Add `listBookSummaries()` and `getBookOrThrow(Long id)` using repository data.

- [ ] **Step 4: Create `CsvImportService`**

Use Apache Commons CSV to parse multipart input:

```java
@Service
public class CsvImportService {
  private final BookService bookService;
  private final NoteRepository noteRepository;

  public CsvImportService(BookService bookService, NoteRepository noteRepository) {
    this.bookService = bookService;
    this.noteRepository = noteRepository;
  }

  @Transactional
  public CsvImportResponse importCsv(MultipartFile file) {
    if (file == null || file.isEmpty()) {
      throw new IllegalArgumentException("请选择 CSV 文件。");
    }
    // Parse headers: 书名, 作者, 章节名称, 笔记内容, 备注.
    // Create notes for rows with non-blank 笔记内容.
  }
}
```

The implementation must count imported notes and skipped rows, default blank book to `未知书名`, and allow blank author.

- [ ] **Step 5: Create controllers**

Create:

- `NoteController` for `/api/notes`.
- `BookController` for `/api/books`.
- `ImportController` for `/api/import/csv`.
- `ReadingRecordController` for `/api/reading-events` and `/api/reading-records`.
- `HealthController` for `/api/health`.

Example:

```java
@RestController
@RequestMapping("/api/import")
public class ImportController {
  private final CsvImportService csvImportService;

  public ImportController(CsvImportService csvImportService) {
    this.csvImportService = csvImportService;
  }

  @PostMapping("/csv")
  public CsvImportResponse importCsv(@RequestParam("file") MultipartFile file) {
    return csvImportService.importCsv(file);
  }
}
```

- [ ] **Step 6: Add backend unit tests**

Create `CsvImportServiceTest` with a test CSV string:

```csv
书名,作者,章节名称,笔记内容,备注
示例书,示例作者,第一章,这是一条摘录,备注
示例书,示例作者,第二章,,空内容
```

Expected:

- imported notes = 1.
- skipped rows = 1.
- one book exists.

- [ ] **Step 7: Run backend tests**

Run:

```powershell
cd backend
mvn test
```

Expected: all tests pass.

---

### Task 5: Frontend Scaffold

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/index.html`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/styles/global.css`

- [ ] **Step 1: Create frontend package**

Create `frontend/package.json`:

```json
{
  "name": "reading-review-frontend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "vite": "^6.0.7",
    "typescript": "^5.7.2",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.1.1"
  },
  "devDependencies": {}
}
```

- [ ] **Step 2: Create Vite config**

Create `frontend/vite.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8080"
    }
  }
});
```

- [ ] **Step 3: Create React entry**

Create `frontend/src/main.tsx`:

```tsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/global.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

- [ ] **Step 4: Create routes**

Create `frontend/src/App.tsx`:

```tsx
import { NavLink, Route, Routes } from "react-router-dom";
import { BookshelfPage } from "./features/bookshelf/BookshelfPage";
import { ImportPage } from "./features/import/ImportPage";
import { ReadingRecordsPage } from "./features/records/ReadingRecordsPage";
import { ReviewPage } from "./features/review/ReviewPage";
import { SettingsPage } from "./features/settings/SettingsPage";

export default function App() {
  return (
    <div className="appShell">
      <nav className="topNav">
        <NavLink to="/">回顾</NavLink>
        <NavLink to="/books">书架</NavLink>
        <NavLink to="/import">导入</NavLink>
        <NavLink to="/records">记录</NavLink>
        <NavLink to="/settings">设置</NavLink>
      </nav>
      <Routes>
        <Route path="/" element={<ReviewPage />} />
        <Route path="/books" element={<BookshelfPage />} />
        <Route path="/import" element={<ImportPage />} />
        <Route path="/records" element={<ReadingRecordsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </div>
  );
}
```

- [ ] **Step 5: Create calm base styles**

Create `frontend/src/styles/global.css` with CSS variables for paper/night:

```css
:root {
  --paper: #f4efe5;
  --surface: #fffefa;
  --ink: #2d2923;
  --muted: #817768;
  --sage: #66745e;
}

[data-theme="night"] {
  --paper: #0f1211;
  --surface: #1b1f1d;
  --ink: #efe8d7;
  --muted: #b1a58e;
  --sage: #99b18d;
}

body {
  margin: 0;
  min-height: 100dvh;
  background: var(--paper);
  color: var(--ink);
  font-family: "Noto Serif SC", "Songti SC", "STSong", serif;
}

.appShell {
  min-height: 100dvh;
  padding: 1rem;
}

.topNav {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 1rem;
}
```

- [ ] **Step 6: Install and build frontend**

Run:

```powershell
cd frontend
npm.cmd install
npm.cmd run build
```

Expected: Vite build succeeds.

---

### Task 6: Frontend API Client and Feature Pages

**Files:**
- Create: `frontend/src/api/client.ts`
- Create feature page files under `frontend/src/features/`

- [ ] **Step 1: Create API types and client**

Create `frontend/src/api/client.ts`:

```ts
export type Note = {
  id: number;
  bookId: number;
  bookTitle: string;
  author: string;
  content: string;
  chapter?: string;
  remark?: string;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BookSummary = {
  id: number;
  title: string;
  author: string;
  noteCount: number;
  favoriteCount: number;
  totalDurationMs: number;
  viewCount: number;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, options);
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json() as Promise<T>;
}

export const api = {
  notes: () => request<Note[]>("/api/notes"),
  randomNote: () => request<Note>("/api/notes/random"),
  toggleFavorite: (noteId: number) => request<Note>(`/api/notes/${noteId}/favorite`, { method: "PATCH" }),
  books: () => request<BookSummary[]>("/api/books"),
  bookNotes: (bookId: number) => request<Note[]>(`/api/books/${bookId}/notes`),
  importCsv: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<{ importedNotes: number; skippedRows: number; bookCount: number }>("/api/import/csv", {
      method: "POST",
      body: formData
    });
  }
};
```

- [ ] **Step 2: Create `ImportPage`**

Create a file upload page that calls `api.importCsv(file)` and shows imported/skipped/book counts.

- [ ] **Step 3: Create `ReviewPage`**

Create random review UI:

- loads `/api/notes`;
- redirects visually to import empty state when no notes exist;
- displays current note in a paper card;
- supports previous, random, next;
- toggles favorite;
- posts reading events when switching notes.

- [ ] **Step 4: Create `BookshelfPage`**

Create bookshelf UI:

- calls `/api/books`;
- shows book title, author, note count, favorite count, total duration;
- supports clicking a book to list notes.

- [ ] **Step 5: Create `ReadingRecordsPage`**

Create a summary page using `/api/reading-records/summary`.

- [ ] **Step 6: Create `SettingsPage`**

Create paper/night theme switch using `localStorage` and `document.documentElement.dataset.theme`.

- [ ] **Step 7: Build frontend**

Run:

```powershell
cd frontend
npm.cmd run build
```

Expected: TypeScript and Vite build succeed.

---

### Task 7: End-to-End Smoke Verification

**Files:**
- Modify only if verification discovers defects.

- [ ] **Step 1: Start PostgreSQL**

Run:

```powershell
npm.cmd run db:up
```

Expected: PostgreSQL container is healthy. If Docker is unavailable, use an existing local PostgreSQL and set `READING_REVIEW_DB_URL`, `READING_REVIEW_DB_USER`, and `READING_REVIEW_DB_PASSWORD`.

- [ ] **Step 2: Start backend**

Run:

```powershell
cd backend
mvn spring-boot:run
```

Expected: backend starts on `http://localhost:8080`.

- [ ] **Step 3: Start frontend**

Run:

```powershell
cd frontend
npm.cmd run dev
```

Expected: frontend starts on `http://localhost:5173`.

- [ ] **Step 4: Manual smoke flow**

Use the browser:

1. Open `http://localhost:5173/import`.
2. Import a CSV with `书名,作者,章节名称,笔记内容,备注`.
3. Open `/`.
4. Verify a note appears.
5. Toggle favorite.
6. Open `/books`.
7. Verify the imported book appears.
8. Open `/records`.
9. Verify reading summary changes after switching notes.
10. Toggle night theme under `/settings`.

- [ ] **Step 5: Run final verification**

Run:

```powershell
npm.cmd run verify:webapp
git status --short --branch
```

Expected: frontend build and backend tests pass; Git status shows only intended standard Web App files.

---

### Task 8: Commit and Push

**Files:**
- All files created or modified in Tasks 1-7.

- [ ] **Step 1: Commit infrastructure and backend**

Run:

```powershell
git add infra backend README.md package.json
git commit -m "feat: add spring boot backend"
```

- [ ] **Step 2: Commit frontend**

Run:

```powershell
git add frontend README.md package.json
git commit -m "feat: add react web frontend"
```

- [ ] **Step 3: Commit integration fixes**

If any verification fixes remain:

```powershell
git add .
git commit -m "fix: complete standard web app integration"
```

- [ ] **Step 4: Push**

Run:

```powershell
git push origin main
```

Expected: GitHub `main` contains the new monorepo Web App.

---

## Self-Review

- Spec coverage: The plan covers monorepo structure, React/Vite frontend, Spring Boot backend, PostgreSQL/Flyway schema, CSV import, review, bookshelf, reading records, paper/night theme, and keeping the legacy app intact.
- Placeholder scan: No task contains `TBD`, `TODO`, `fill in`, or an undefined file path. The only flexible area is exact frontend component implementation details, but each page has concrete API and behavior requirements.
- Type consistency: DTO names, API paths, domain names, and frontend types match across backend and frontend tasks.
