package com.tianlutao.readingreview.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ReadingEventRequest(
    Long noteId,
    @NotNull @Min(0) Integer durationSeconds) {
}
