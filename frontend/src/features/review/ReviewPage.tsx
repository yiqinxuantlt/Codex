import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent
} from "react";
import { Link } from "react-router-dom";
import { api, type NoteResponse } from "../../api/client";

type MotionDirection = "none" | "previous" | "next" | "random";

const SWIPE_THRESHOLD = 52;
const SWIPE_MAX_OFFSET = 92;

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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest("button, a, input, textarea, select"));
}

export function ReviewPage() {
  const [notes, setNotes] = useState<NoteResponse[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [motion, setMotion] = useState<MotionDirection>("none");
  const [motionKey, setMotionKey] = useState(0);
  const noteIdRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const pointerRef = useRef({
    id: -1,
    startX: 0,
    startY: 0,
    deltaX: 0,
    deltaY: 0,
    swiping: false
  });

  const visibleNotes = useMemo(
    () => (showFavoritesOnly ? notes.filter((note) => note.favorite) : notes),
    [notes, showFavoritesOnly]
  );
  const currentNote = visibleNotes[index] ?? null;

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
    setIndex((currentIndex) => (visibleNotes.length ? Math.min(currentIndex, visibleNotes.length - 1) : 0));
  }, [visibleNotes.length]);

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
    if (!currentNote || !visibleNotes.length) {
      return "";
    }

    return `${index + 1} / ${visibleNotes.length}`;
  }, [currentNote, index, visibleNotes.length]);

  const movePrevious = useCallback(() => {
    if (!visibleNotes.length) {
      return;
    }

    setMotion("previous");
    setMotionKey((currentKey) => currentKey + 1);
    setIndex((currentIndex) => (currentIndex - 1 + visibleNotes.length) % visibleNotes.length);
  }, [visibleNotes.length]);

  const moveNext = useCallback(() => {
    if (!visibleNotes.length) {
      return;
    }

    setMotion("next");
    setMotionKey((currentKey) => currentKey + 1);
    setIndex((currentIndex) => (currentIndex + 1) % visibleNotes.length);
  }, [visibleNotes.length]);

  const moveRandom = useCallback(() => {
    if (!visibleNotes.length) {
      return;
    }

    setMotion("random");
    setMotionKey((currentKey) => currentKey + 1);
    setIndex((currentIndex) => nextRandomIndex(visibleNotes.length, currentIndex));
  }, [visibleNotes.length]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isInteractiveTarget(event.target)) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        movePrevious();
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        moveNext();
      }

      if (event.key === " " || event.key === "Spacebar") {
        event.preventDefault();
        moveRandom();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [moveNext, movePrevious, moveRandom]);

  function resetPointer(event: PointerEvent<HTMLElement>) {
    if (pointerRef.current.id !== event.pointerId) {
      return;
    }

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // The browser may have already released it after a cancelled gesture.
    }

    pointerRef.current = {
      id: -1,
      startX: 0,
      startY: 0,
      deltaX: 0,
      deltaY: 0,
      swiping: false
    };
    setDragOffset(0);
  }

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    if (visibleNotes.length <= 1 || isInteractiveTarget(event.target)) {
      return;
    }

    pointerRef.current = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      deltaX: 0,
      deltaY: 0,
      swiping: false
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    const pointer = pointerRef.current;

    if (pointer.id !== event.pointerId) {
      return;
    }

    pointer.deltaX = event.clientX - pointer.startX;
    pointer.deltaY = event.clientY - pointer.startY;

    if (!pointer.swiping && Math.abs(pointer.deltaX) > 12 && Math.abs(pointer.deltaX) > Math.abs(pointer.deltaY) * 1.15) {
      pointer.swiping = true;
    }

    if (!pointer.swiping) {
      return;
    }

    event.preventDefault();
    setDragOffset(clamp(pointer.deltaX, -SWIPE_MAX_OFFSET, SWIPE_MAX_OFFSET));
  }

  function handlePointerUp(event: PointerEvent<HTMLElement>) {
    const pointer = pointerRef.current;

    if (pointer.id !== event.pointerId) {
      return;
    }

    const shouldTurn = pointer.swiping && Math.abs(pointer.deltaX) >= SWIPE_THRESHOLD;
    const direction = pointer.deltaX > 0 ? "next" : "previous";

    resetPointer(event);

    if (!shouldTurn) {
      return;
    }

    if (direction === "next") {
      moveNext();
      return;
    }

    movePrevious();
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

  function toggleFavoritesFilter() {
    setShowFavoritesOnly((currentValue) => !currentValue);
    setIndex(0);
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

  if (!currentNote && notes.length && showFavoritesOnly) {
    return (
      <section className="page page-narrow">
        <div className="empty-state">
          <h1>还没有收藏的句子</h1>
          <p>取消筛选后可以继续浏览全部笔记。</p>
          <button className="secondary-button" type="button" onClick={toggleFavoritesFilter}>
            查看全部
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

  const cardStyle = {
    "--drag-x": `${dragOffset}px`
  } as CSSProperties;

  return (
    <section className="page review-page">
      <div className="review-meta">
        <span>{notePosition}</span>
        {currentNote.chapterName ? <span>{currentNote.chapterName}</span> : null}
      </div>

      <div className="review-toolbar">
        <button
          className={`filter-chip ${showFavoritesOnly ? "is-selected" : ""}`}
          type="button"
          onClick={toggleFavoritesFilter}
          aria-pressed={showFavoritesOnly}
        >
          只看收藏
        </button>
        <span>{visibleNotes.length} 条</span>
      </div>

      <article
        key={`${currentNote.id}-${motionKey}`}
        className={`note-card note-card-${motion} ${dragOffset ? "is-dragging" : ""}`}
        style={cardStyle}
        aria-live="polite"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={resetPointer}
      >
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
          ← 上一条
        </button>
        <button className="primary-button" type="button" onClick={moveRandom}>
          随机
        </button>
        <button className="secondary-button" type="button" onClick={moveNext}>
          下一条 →
        </button>
      </div>
    </section>
  );
}
