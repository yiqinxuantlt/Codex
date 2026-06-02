package com.tianlutao.readingreview.dto;

import java.time.Instant;

public record NoteResponse(
    Long id,
    String content,
    String bookTitle,
    String author,
    String chapterName,
    String remark,
    boolean favorite,
    Instant createdAt) {
}
