import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, type ReadingSummaryResponse } from "../../api/client";

function formatDuration(seconds = 0) {
  if (seconds < 60) {
    return `${Math.round(seconds)} 秒`;
  }

  if (seconds < 3600) {
    return `${Math.round(seconds / 60)} 分钟`;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return minutes ? `${hours} 小时 ${minutes} 分钟` : `${hours} 小时`;
}

function formatViewedAt(value?: string | null) {
  if (!value) {
    return "刚刚";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function RecordsPage() {
  const [summary, setSummary] = useState<ReadingSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setSummary(await api.readingSummary());
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "无法读取阅读记录。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const maxDuration = useMemo(() => {
    const durations = summary?.recentEvents.map((event) => event.durationSeconds ?? 0) ?? [];
    return Math.max(1, ...durations);
  }, [summary]);

  if (loading) {
    return (
      <section className="page page-narrow">
        <div className="quiet-state">正在读取记录...</div>
      </section>
    );
  }

  if (error && !summary) {
    return (
      <section className="page page-narrow">
        <div className="empty-state">
          <h1>暂时读不到记录</h1>
          <p>{error}</p>
          <button className="secondary-button" type="button" onClick={() => void loadSummary()}>
            重试
          </button>
        </div>
      </section>
    );
  }

  if (!summary || summary.totalViews === 0) {
    return (
      <section className="page page-narrow">
        <div className="empty-state">
          <h1>还没有阅读记录</h1>
          <p>回顾几条笔记后，这里会开始累积。</p>
          <Link className="primary-link" to="/">
            去回顾
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <p className="eyebrow">Records</p>
        <h1>阅读记录</h1>
        <p>停留时间和最近回顾会在这里汇总。</p>
      </div>

      {error ? (
        <p className="status-message status-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="metric-grid">
        <div className="metric-card">
          <span>{summary.totalViews}</span>
          <small>总回顾</small>
        </div>
        <div className="metric-card">
          <span>{summary.uniqueNotesViewed}</span>
          <small>不同笔记</small>
        </div>
        <div className="metric-card">
          <span>{formatDuration(summary.totalDurationSeconds)}</span>
          <small>总停留</small>
        </div>
        <div className="metric-card">
          <span>{formatDuration(summary.averageDurationSeconds)}</span>
          <small>平均停留</small>
        </div>
      </div>

      <section className="records-list">
        <div className="detail-heading">
          <div>
            <p className="eyebrow">Recent</p>
            <h2>最近回顾</h2>
          </div>
        </div>

        {summary.recentEvents.map((event, eventIndex) => {
          const duration = event.durationSeconds ?? 0;
          const width = `${Math.max(8, (duration / maxDuration) * 100)}%`;

          return (
            <article className="event-row" key={`${event.noteId ?? "event"}-${event.viewedAt ?? eventIndex}`}>
              <div>
                <strong>{event.bookTitle || "未命名"}</strong>
                <p>{event.contentPreview || "没有预览内容"}</p>
                <small>{formatViewedAt(event.viewedAt)}</small>
              </div>
              <div className="event-duration">
                <span>{formatDuration(duration)}</span>
                <i style={{ width }} aria-hidden="true" />
              </div>
            </article>
          );
        })}
      </section>
    </section>
  );
}
