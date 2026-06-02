package com.tianlutao.readingreview.dto;

import java.time.Instant;
import java.util.List;

public record ReadingSummaryResponse(
    long totalViews,
    long uniqueNotesViewed,
    long totalDurationSeconds,
    double averageDurationSeconds,
    List<RecentEventResponse> recentEvents) {

  public record RecentEventResponse(
      Long noteId,
      String bookTitle,
      String contentPreview,
      Instant viewedAt,
      int durationSeconds) {
  }
}
