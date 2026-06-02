export type NoteResponse = {
  id: number;
  content: string;
  bookTitle: string;
  author?: string | null;
  chapterName?: string | null;
  remark?: string | null;
  favorite: boolean;
  createdAt: string;
};

export type BookSummaryResponse = {
  id: number;
  title: string;
  author?: string | null;
  noteCount: number;
  favoriteCount: number;
  lastViewedAt?: string | null;
};

export type CsvImportResponse = {
  importedNotes: number;
  skippedRows: number;
  totalNotes: number;
  totalBooks: number;
};

export type ReadingEventItem = {
  noteId?: number;
  bookTitle?: string | null;
  contentPreview?: string | null;
  viewedAt?: string | null;
  durationSeconds?: number | null;
};

export type ReadingSummaryResponse = {
  totalViews: number;
  uniqueNotesViewed: number;
  totalDurationSeconds: number;
  averageDurationSeconds: number;
  recentEvents: ReadingEventItem[];
};

export type HealthResponse = {
  status: string;
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function responseMessage(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();

  if (contentType.includes("text/html") || text.trimStart().startsWith("<!DOCTYPE")) {
    return "后端 API 未响应，请确认服务运行在 http://localhost:8080。";
  }

  if (!text) {
    return `${response.status} ${response.statusText}`.trim();
  }

  try {
    const json = JSON.parse(text) as { message?: string; error?: string };
    return json.message || json.error || text;
  } catch {
    return text;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, options);
  } catch {
    throw new ApiError(0, "后端 API 未响应，请确认服务运行在 http://localhost:8080。");
  }

  if (!response.ok) {
    throw new ApiError(response.status, await responseMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

function jsonRequest<T>(path: string, method: string, body: unknown, options: RequestInit = {}) {
  return request<T>(path, {
    ...options,
    method,
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    },
    body: JSON.stringify(body)
  });
}

export const api = {
  health: () => request<HealthResponse>("/api/health"),
  notes: () => request<NoteResponse[]>("/api/notes"),
  randomNote: async () => {
    try {
      return await request<NoteResponse>("/api/notes/random");
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }

      throw error;
    }
  },
  toggleFavorite: (noteId: number) =>
    request<NoteResponse>(`/api/notes/${noteId}/favorite`, {
      method: "PATCH"
    }),
  books: () => request<BookSummaryResponse[]>("/api/books"),
  bookNotes: (bookId: number) => request<NoteResponse[]>(`/api/books/${bookId}/notes`),
  importCsv: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    return request<CsvImportResponse>("/api/import/csv", {
      method: "POST",
      body: formData
    });
  },
  recordReadingEvent: (noteId: number, durationSeconds: number, options: RequestInit = {}) =>
    jsonRequest<void>("/api/reading-events", "POST", { noteId, durationSeconds }, options),
  readingSummary: () => request<ReadingSummaryResponse>("/api/reading-records/summary")
};
