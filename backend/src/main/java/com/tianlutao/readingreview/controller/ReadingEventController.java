package com.tianlutao.readingreview.controller;

import com.tianlutao.readingreview.dto.ReadingEventRequest;
import com.tianlutao.readingreview.service.ReadingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ReadingEventController {

  private final ReadingService readingService;

  public ReadingEventController(ReadingService readingService) {
    this.readingService = readingService;
  }

  @PostMapping("/api/reading-events")
  public ResponseEntity<Void> recordEvent(@Valid @RequestBody ReadingEventRequest request) {
    readingService.recordEvent(request);
    return ResponseEntity.noContent().build();
  }
}
