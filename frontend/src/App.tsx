import { useEffect, useState } from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { api } from "./api/client";
import { BookshelfPage } from "./features/bookshelf/BookshelfPage";
import { ImportPage } from "./features/import/ImportPage";
import { RecordsPage } from "./features/records/RecordsPage";
import { ReviewPage } from "./features/review/ReviewPage";
import { SettingsPage } from "./features/settings/SettingsPage";

const navItems = [
  { to: "/", label: "回顾", shortLabel: "阅", end: true },
  { to: "/books", label: "书架", shortLabel: "书", end: false },
  { to: "/import", label: "导入", shortLabel: "入", end: false },
  { to: "/records", label: "记录", shortLabel: "记", end: false },
  { to: "/settings", label: "设置", shortLabel: "设", end: false }
];

function AppNav({ variant }: { variant: "desktop" | "mobile" }) {
  return (
    <nav className={`${variant}-nav`} aria-label={variant === "desktop" ? "主导航" : "底部导航"}>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `nav-link ${isActive ? "is-active" : ""}`}
        >
          <span className="nav-mark" aria-hidden="true">
            {item.shortLabel}
          </span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function HealthPill() {
  const [state, setState] = useState<"checking" | "ok" | "down">("checking");

  useEffect(() => {
    let active = true;

    api
      .health()
      .then((health) => {
        if (active) {
          setState(health.status === "ok" ? "ok" : "down");
        }
      })
      .catch(() => {
        if (active) {
          setState("down");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const label = state === "ok" ? "后端在线" : state === "down" ? "后端离线" : "连接中";

  return (
    <span className={`health-pill health-${state}`} aria-label={label}>
      <span aria-hidden="true" />
      {label}
    </span>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <NavLink to="/" className="brand-lockup" aria-label="阅读笔记回顾首页">
          <span className="brand-seal" aria-hidden="true">
            阅
          </span>
          <span>
            <strong>阅读笔记回顾</strong>
            <small>Reading Notes</small>
          </span>
        </NavLink>
        <AppNav variant="desktop" />
        <HealthPill />
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<ReviewPage />} />
          <Route path="/review" element={<Navigate to="/" replace />} />
          <Route path="/books" element={<BookshelfPage />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/records" element={<RecordsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <AppNav variant="mobile" />
    </div>
  );
}
