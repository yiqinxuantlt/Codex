package com.tianlutao.readingreview.controller;

import com.tianlutao.readingreview.dto.CsvImportResponse;
import com.tianlutao.readingreview.service.CsvImportService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class ImportController {

  private final CsvImportService csvImportService;

  public ImportController(CsvImportService csvImportService) {
    this.csvImportService = csvImportService;
  }

  @PostMapping(value = "/api/import/csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public CsvImportResponse importCsv(@RequestPart("file") MultipartFile file) {
    return csvImportService.importCsv(file);
  }
}
