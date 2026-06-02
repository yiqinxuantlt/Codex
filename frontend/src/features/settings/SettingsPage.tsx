import { useState } from "react";
import { applyTheme, getStoredTheme, storeTheme, type ThemeName } from "./theme";

const themeOptions: Array<{
  value: ThemeName;
  label: string;
  hint: string;
}> = [
  {
    value: "paper",
    label: "纸页",
    hint: "浅色纸面"
  },
  {
    value: "night",
    label: "夜读",
    hint: "暗色低光"
  }
];

export function SettingsPage() {
  const [theme, setTheme] = useState<ThemeName>(() => {
    const stored = getStoredTheme();
    applyTheme(stored);
    return stored;
  });

  function chooseTheme(nextTheme: ThemeName) {
    setTheme(nextTheme);
    storeTheme(nextTheme);
  }

  return (
    <section className="page page-narrow">
      <div className="page-header">
        <p className="eyebrow">Settings</p>
        <h1>设置</h1>
        <p>当前版本只在本地保存主题偏好。</p>
      </div>

      <section className="settings-section">
        <div className="detail-heading">
          <div>
            <p className="eyebrow">Theme</p>
            <h2>阅读主题</h2>
          </div>
        </div>

        <div className="theme-grid" role="group" aria-label="主题选择">
          {themeOptions.map((option) => (
            <button
              className={`theme-choice ${theme === option.value ? "is-selected" : ""}`}
              type="button"
              key={option.value}
              onClick={() => chooseTheme(option.value)}
              aria-pressed={theme === option.value}
            >
              <span className={`theme-swatch theme-swatch-${option.value}`} aria-hidden="true" />
              <strong>{option.label}</strong>
              <small>{option.hint}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <div className="detail-heading">
          <div>
            <p className="eyebrow">Storage</p>
            <h2>数据来源</h2>
          </div>
        </div>
        <p className="settings-copy">笔记、书籍、收藏和阅读记录都来自后端 API。</p>
      </section>
    </section>
  );
}
