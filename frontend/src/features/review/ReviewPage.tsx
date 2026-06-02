import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api, type NoteResponse } from "../../api/client";

function formatSource(note: NoteResponse) {
  const title = note.bookTitle?.trim() || "未命名";
  const author = note.author?.trim() ? note.author.trim() : "";
  return `——《${title}》${author}`;
}

function nextRandomIndex(length: number, currentIndex: number) {
  if (length <= 1) {
    return currentIndex;
  }

  let nextIndex = currentIndex;

  while (nextIndex === currentIndex) {
    nextIndex = Math.floor(Math.random() * length);
  }

  return nextIndex;
}

export function ReviewPage() {
  const [notes, setNotes] = useState<NoteResponse[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const noteIdRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);

  const currentNote = notes[index] ?? null;

  const loadNotes = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const nextNotes = await api.notes();
      setNotes(nextNotes);
      setIndex((currentIndex) => (nextNotes.length ? Math.min(currentIndex, nextNotes.length - 1) : 0));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "无法读取笔记。");
    } finally {
      setLoading(false);
    }
  }, []);

  const flushDwell = useCallback((mode: "normal" | "hide" = "normal") => {
    const noteId = noteIdRef.current;
    const startedAt = startedAtRef.current;

    if (!noteId || !startedAt) {
      return;
    }

    const durationSeconds = Math.floor((Date.now() - startedAt) / 1000);
    startedAtRef.current = null;

    if (durationSeconds < 1) {
      return;
    }

    if (mode === "hide" && "sendBeacon" in navigator) {
      const payload = JSON.stringify({ noteId, durationSeconds });
      const sent = navigator.sendBeacon(
        "/api/reading-events",
        new Blob([payload], {
          type: "application/json"
        })
      );

      if (sent) {
        return;
      }
    }

    void api.recordReadingEvent(noteId, durationSeconds, mode === "hide" ? { keepalive: true } : {}).catch(() => {
      // Dwell tracking should never interrupt reading.
    });
  }, []);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    if (!currentNote) {
      noteIdRef.current = null;
      startedAtRef.current = null;
      return;
    }

    noteIdRef.current = currentNote.id;
    startedAtRef.current = Date.now();

    return () => {
      flushDwell();
    };
  }, [currentNote?.id, flushDwell]);

  useEffect(() => {
    function handlePageHide() {
      flushDwell("hide");
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        flushDwell("hide");
        return;
      }

      if (noteIdRef.current) {
        startedAtRef.current = Date.now();
      }
    }

    window.addEventListener("pagehide", handlePageHide);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [flushDwell]);

  const notePosition = useMemo(() => {
    if (!currentNote || !notes.length) {
      return "";
    }

    return `${index + 1} / ${notes.length}`;
  }, [currentNote, index, notes.length]);

  function movePrevious() {
    setIndex((currentIndex) => (notes.length ? (currentIndex - 1 + notes.length) % notes.length : 0));
  }

  function moveNext() {
    setIndex((currentIndex) => (notes.length ? (currentIndex + 1) % notes.length : 0));
  }

  function moveRandom() {
    setIndex((currentIndex) => nextRandomIndex(notes.length, currentIndex));
  }

  async function toggleFavorite() {
    if (!currentNote) {
      return;
    }

    setFavoriteBusy(true);
    setError("");

    try {
      const updated = await api.toggleFavorite(currentNote.id);
      setNotes((currentNotes) => currentNotes.map((note) => (note.id === updated.id ? updated : note)));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "收藏状态更新失败。");
    } finally {
      setFavoriteBusy(false);
    }
  }

  if (loading) {
    return (
      <section className="page page-narrow">
        <div className="quiet-state">正在翻开笔记...</div>
      </section>
    );
  }

  if (error && !currentNote) {
    return (
      <section className="page page-narrow">
        <div className="empty-state">
          <h1>暂时读不到笔记</h1>
          <p>{error}</p>
          <button className="secondary-button" type="button" onClick={() => void loadNotes()}>
            重试
          </button>
        </div>
      </section>
    );
  }

  if (!currentNote) {
    return (
      <section className="page page-narrow">
        <div className="empty-state">
          <h1>还没有可回顾的笔记</h1>
          <p>先导入 CSV，再回来随机翻阅。</p>
          <Link className="primary-link" to="/import">
            去导入
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page review-page">
      <div className="review-meta">
        <span>{notePosition}</span>
        {currentNote.chapterName ? <span>{currentNote.chapterName}</span> : null}
      </div>

      <article className="note-card" aria-live="polite">
        <button
          className={`favorite-button ${currentNote.favorite ? "is-favorite" : ""}`}
          type="button"
          onClick={() => void toggleFavorite()}
          aria-label={currentNote.favorite ? "取消收藏" : "收藏当前笔记"}
          aria-pressed={currentNote.favorite}
          disabled={favoriteBusy}
        >
          {currentNote.favorite ? "★" : "☆"}
        </button>
        <p className="note-content">{currentNote.content}</p>
        <footer className="note-footer">
          <span>{formatSource(currentNote)}</span>
          {currentNote.remark ? <small>{currentNote.remark}</small> : null}
        </footer>
      </article>

      {error ? (
        <p className="status-message status-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="review-actions" aria-label="回顾操作">
        <button className="secondary-button" type="button" onClick={movePrevious}>
          ‹ 上一条
        </button>
        <button className="primary-button" type="button" onClick={moveRandom}>
          随机
        </button>
        <button className="secondary-button" type="button" onClick={moveNext}>
          下一条 ›
        </button>
      </div>
    </section>
  );
}
