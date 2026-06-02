import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api, type CsvImportResponse } from "../../api/client";

export function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<CsvImportResponse | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);
    setResult(null);
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setError("请选择一个 CSV 文件。");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      setResult(await api.importCsv(file));
      setFile(null);
      event.currentTarget.reset();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "导入失败，请稍后再试。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page page-narrow">
      <div className="page-header">
        <p className="eyebrow">CSV Import</p>
        <h1>把摘录交给后端保存</h1>
        <p>导入后就可以在回顾、书架和记录页里继续使用。</p>
      </div>

      <form className="import-panel" onSubmit={handleSubmit}>
        <input id="csv-upload" className="sr-only" type="file" accept=".csv,text/csv" onChange={handleFileChange} />
        <label className="upload-box" htmlFor="csv-upload">
          <span className="upload-symbol" aria-hidden="true">
            +
          </span>
          <strong>{file ? file.name : "选择 CSV 文件"}</strong>
          <small>字段由后端解析，前端不保存笔记数据。</small>
        </label>

        <div className="form-actions">
          <button className="primary-button" type="submit" disabled={!file || submitting}>
            {submitting ? "导入中" : "开始导入"}
          </button>
          <Link className="secondary-link" to="/">
            去回顾
          </Link>
        </div>

        {error ? (
          <p className="status-message status-error" role="alert">
            {error}
          </p>
        ) : null}
      </form>

      {result ? (
        <section className="result-panel" aria-live="polite">
          <div className="metric-grid">
            <div className="metric-card">
              <span>{result.importedNotes}</span>
              <small>新增笔记</small>
            </div>
            <div className="metric-card">
              <span>{result.skippedRows}</span>
              <small>跳过行</small>
            </div>
            <div className="metric-card">
              <span>{result.totalNotes}</span>
              <small>当前笔记</small>
            </div>
            <div className="metric-card">
              <span>{result.totalBooks}</span>
              <small>当前书籍</small>
            </div>
          </div>
          <div className="inline-actions">
            <Link className="primary-link" to="/">
              开始回顾
            </Link>
            <Link className="secondary-link" to="/books">
              查看书架
            </Link>
          </div>
        </section>
      ) : null}
    </section>
  );
}
