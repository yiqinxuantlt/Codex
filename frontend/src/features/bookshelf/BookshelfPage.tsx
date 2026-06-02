import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, type BookSummaryResponse, type NoteResponse } from "../../api/client";
import { formatDateTime } from "../../shared/format";

function bookAuthor(author?: string | null) {
  return author?.trim() || "作者未填";
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function BookshelfPage() {
  const [books, setBooks] = useState<BookSummaryResponse[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [notes, setNotes] = useState<NoteResponse[]>([]);
  const [bookQuery, setBookQuery] = useState("");
  const [noteQuery, setNoteQuery] = useState("");
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [error, setError] = useState("");

  const loadBooks = useCallback(async () => {
    setLoadingBooks(true);
    setError("");

    try {
      const nextBooks = await api.books();
      setBooks(nextBooks);
      setSelectedBookId((currentId) => currentId ?? nextBooks[0]?.id ?? null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "无法读取书架。");
    } finally {
      setLoadingBooks(false);
    }
  }, []);

  useEffect(() => {
    void loadBooks();
  }, [loadBooks]);

  useEffect(() => {
    if (!selectedBookId) {
      setNotes([]);
      return;
    }

    let active = true;
    setLoadingNotes(true);
    setError("");
    setNoteQuery("");

    api
      .bookNotes(selectedBookId)
      .then((nextNotes) => {
        if (active) {
          setNotes(nextNotes);
        }
      })
      .catch((nextError) => {
        if (active) {
          setError(nextError instanceof Error ? nextError.message : "无法读取书籍笔记。");
        }
      })
      .finally(() => {
        if (active) {
          setLoadingNotes(false);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedBookId]);

  const selectedBook = useMemo(
    () => books.find((book) => book.id === selectedBookId) ?? null,
    [books, selectedBookId]
  );

  const filteredBooks = useMemo(() => {
    const query = normalize(bookQuery);
    if (!query) {
      return books;
    }

    return books.filter((book) => `${book.title} ${book.author ?? ""}`.toLowerCase().includes(query));
  }, [bookQuery, books]);

  const filteredNotes = useMemo(() => {
    const query = normalize(noteQuery);
    if (!query) {
      return notes;
    }

    return notes.filter((note) =>
      `${note.content} ${note.chapterName ?? ""} ${note.remark ?? ""}`.toLowerCase().includes(query)
    );
  }, [noteQuery, notes]);

  const bookshelfStats = useMemo(
    () => ({
      bookCount: books.length,
      noteCount: books.reduce((total, book) => total + book.noteCount, 0),
      favoriteCount: books.reduce((total, book) => total + book.favoriteCount, 0)
    }),
    [books]
  );

  if (loadingBooks) {
    return (
      <section className="page page-narrow">
        <div className="quiet-state">正在整理书架...</div>
      </section>
    );
  }

  if (!books.length && !error) {
    return (
      <section className="page page-narrow">
        <div className="empty-state">
          <h1>书架还是空的</h1>
          <p>导入 CSV 后，这里会按书聚合。</p>
          <Link className="primary-link" to="/import">
            去导入
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <p className="eyebrow">Bookshelf</p>
        <h1>书架</h1>
        <p>按书查看摘录、收藏数量和最近回顾。</p>
      </div>

      {error ? (
        <p className="status-message status-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="bookshelf-summary" aria-label="书架概览">
        <div>
          <span>{bookshelfStats.bookCount}</span>
          <small>本书</small>
        </div>
        <div>
          <span>{bookshelfStats.noteCount}</span>
          <small>条摘录</small>
        </div>
        <div>
          <span>{bookshelfStats.favoriteCount}</span>
          <small>条收藏</small>
        </div>
      </div>

      <div className="books-layout">
        <aside className="book-list" aria-label="书籍列表">
          <label className="search-field">
            <span>搜索书籍</span>
            <input
              type="search"
              value={bookQuery}
              onChange={(event) => setBookQuery(event.target.value)}
              placeholder="书名或作者"
            />
          </label>

          {filteredBooks.length ? (
            filteredBooks.map((book) => (
              <button
                className={`book-button ${book.id === selectedBookId ? "is-selected" : ""}`}
                type="button"
                key={book.id}
                onClick={() => setSelectedBookId(book.id)}
                aria-pressed={book.id === selectedBookId}
              >
                <span>
                  <strong>{book.title}</strong>
                  <small>{bookAuthor(book.author)}</small>
                </span>
                <span className="book-count">{book.noteCount}</span>
              </button>
            ))
          ) : (
            <div className="quiet-state small">没有匹配的书籍</div>
          )}
        </aside>

        <section className="book-detail" aria-live="polite">
          {selectedBook ? (
            <>
              <div className="detail-heading">
                <div>
                  <p className="eyebrow">Selected Book</p>
                  <h2>{selectedBook.title}</h2>
                  <p>{bookAuthor(selectedBook.author)}</p>
                </div>
                <dl className="compact-stats">
                  <div>
                    <dt>笔记</dt>
                    <dd>{selectedBook.noteCount}</dd>
                  </div>
                  <div>
                    <dt>收藏</dt>
                    <dd>{selectedBook.favoriteCount}</dd>
                  </div>
                  <div>
                    <dt>最近</dt>
                    <dd>{formatDateTime(selectedBook.lastViewedAt, "尚未回顾")}</dd>
                  </div>
                </dl>
              </div>

              <label className="search-field search-field-inline">
                <span>搜索摘录</span>
                <input
                  type="search"
                  value={noteQuery}
                  onChange={(event) => setNoteQuery(event.target.value)}
                  placeholder="句子、章节或备注"
                />
              </label>

              {loadingNotes ? <div className="quiet-state small">正在取出摘录...</div> : null}

              <div className="note-list">
                {!loadingNotes && !filteredNotes.length ? <div className="quiet-state small">没有匹配的摘录</div> : null}
                {filteredNotes.map((note) => (
                  <article className="note-list-item" key={note.id}>
                    <p>{note.content}</p>
                    <footer>
                      <span>{note.chapterName || "未分章节"}</span>
                      {note.favorite ? <strong>★</strong> : null}
                    </footer>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h2>选择一本书</h2>
              <p>摘录会显示在这里。</p>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
