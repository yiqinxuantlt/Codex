package com.tianlutao.readingreview.dto;

import java.time.Instant;

public record ErrorResponse(String message, int status, Instant timestamp) {
}
