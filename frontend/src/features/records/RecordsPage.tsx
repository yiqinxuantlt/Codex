import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, type ReadingDayResponse, type ReadingSummaryResponse } from "../../api/client";
import { formatDayLabel, formatDateTime, formatDuration } from "../../shared/format";

export function RecordsPage() {
  const [summary, setSummary] = useState<ReadingSummaryResponse | null>(null);
  const [daily, setDaily] = useState<ReadingDayResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [nextSummary, nextDaily] = await Promise.all([api.readingSummary(), api.readingDaily(14)]);
      setSummary(nextSummary);
      setDaily(nextDaily);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "无法读取阅读记录。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const maxEventDuration = useMemo(() => {
    const durations = summary?.recentEvents.map((event) => event.durationSeconds ?? 0) ?? [];
    return Math.max(1, ...durations);
  }, [summary]);

  const maxDailyDuration = useMemo(() => {
    const durations = daily.map((day) => day.durationSeconds);
    return Math.max(1, ...durations);
  }, [daily]);

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
          <button className="secondary-button" type="button" onClick={() => void loadRecords()}>
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
        <p>停留时间、最近回顾和每日节奏会在这里汇总。</p>
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

      <section className="records-chart-panel">
        <div className="detail-heading">
          <div>
            <p className="eyebrow">Trend</p>
            <h2>最近 14 天</h2>
          </div>
        </div>
        <div className="daily-chart" aria-label="最近 14 天阅读停留趋势">
          {daily.map((day) => {
            const height = day.durationSeconds ? `${Math.max(10, (day.durationSeconds / maxDailyDuration) * 100)}%` : "4px";
            return (
              <article className="daily-bar" key={day.date} title={`${formatDayLabel(day.date)} · ${day.views} 条 · ${formatDuration(day.durationSeconds)}`}>
                <div>
                  <i style={{ height }} aria-hidden="true" />
                </div>
                <span>{formatDayLabel(day.date)}</span>
                <small>{day.views}</small>
              </article>
            );
          })}
        </div>
      </section>

      <section className="records-list">
        <div className="detail-heading">
          <div>
            <p className="eyebrow">Recent</p>
            <h2>最近回顾</h2>
          </div>
        </div>

        {summary.recentEvents.map((event, eventIndex) => {
          const duration = event.durationSeconds ?? 0;
          const width = `${Math.max(8, (duration / maxEventDuration) * 100)}%`;

          return (
            <article className="event-row" key={`${event.noteId ?? "event"}-${event.viewedAt ?? eventIndex}`}>
              <div>
                <strong>{event.bookTitle || "未命名"}</strong>
                <p>{event.contentPreview || "没有预览内容"}</p>
                <small>{formatDateTime(event.viewedAt)}</small>
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
