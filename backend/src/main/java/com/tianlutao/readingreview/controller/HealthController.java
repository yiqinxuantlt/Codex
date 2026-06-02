package com.tianlutao.readingreview.controller;

import com.tianlutao.readingreview.dto.HealthResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

  @GetMapping("/api/health")
  public HealthResponse health() {
    return new HealthResponse("ok");
  }
}
