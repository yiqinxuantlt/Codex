export function formatDuration(seconds = 0) {
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

export function formatDateTime(value?: string | null, fallback = "刚刚") {
  if (!value) {
    return fallback;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function formatDayLabel(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
