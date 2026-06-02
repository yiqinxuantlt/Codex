package com.tianlutao.readingreview.dto;

import java.time.Instant;

public record BookSummaryResponse(
    Long id,
    String title,
    String author,
    long noteCount,
    long favoriteCount,
    Instant lastViewedAt) {
}
