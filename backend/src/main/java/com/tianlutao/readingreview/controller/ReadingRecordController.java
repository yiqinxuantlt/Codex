package com.tianlutao.readingreview.controller;

import com.tianlutao.readingreview.dto.ReadingDayResponse;
import com.tianlutao.readingreview.dto.ReadingSummaryResponse;
import com.tianlutao.readingreview.service.ReadingService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ReadingRecordController {

  private final ReadingService readingService;

  public ReadingRecordController(ReadingService readingService) {
    this.readingService = readingService;
  }

  @GetMapping("/api/reading-records/summary")
  public ReadingSummaryResponse summary() {
    return readingService.summary();
  }

  @GetMapping("/api/reading-records/daily")
  public List<ReadingDayResponse> daily(@RequestParam(required = false) Integer days) {
    return readingService.dailySummary(days);
  }
}
