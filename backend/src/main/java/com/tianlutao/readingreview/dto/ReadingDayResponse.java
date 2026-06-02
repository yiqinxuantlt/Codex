package com.tianlutao.readingreview.dto;

public record ReadingDayResponse(
    String date,
    long views,
    long durationSeconds) {
}
