package com.tianlutao.readingreview.dto;

public record CsvImportResponse(
    long importedNotes,
    long skippedRows,
    long totalNotes,
    long totalBooks) {
}
