package com.tianlutao.readingreview.service;

import com.tianlutao.readingreview.domain.Book;
import com.tianlutao.readingreview.domain.Note;
import com.tianlutao.readingreview.dto.CsvImportResponse;
import com.tianlutao.readingreview.exception.BadRequestException;
import com.tianlutao.readingreview.repository.BookRepository;
import com.tianlutao.readingreview.repository.NoteRepository;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class CsvImportService {

  private static final String HEADER_TITLE = "书名";
  private static final String HEADER_AUTHOR = "作者";
  private static final String HEADER_CHAPTER = "章节名称";
  private static final String HEADER_CONTENT = "笔记内容";
  private static final String HEADER_REMARK = "备注";
  private static final List<String> REQUIRED_HEADERS = List.of(
      HEADER_TITLE,
      HEADER_AUTHOR,
      HEADER_CHAPTER,
      HEADER_CONTENT,
      HEADER_REMARK);
  private static final CSVFormat CSV_FORMAT = CSVFormat.DEFAULT.builder()
      .setHeader()
      .setSkipHeaderRecord(true)
      .setIgnoreEmptyLines(true)
      .build();

  private final BookRepository bookRepository;
  private final NoteRepository noteRepository;

  public CsvImportService(BookRepository bookRepository, NoteRepository noteRepository) {
    this.bookRepository = bookRepository;
    this.noteRepository = noteRepository;
  }

  @Transactional
  public CsvImportResponse importCsv(MultipartFile file) {
    if (file == null || file.isEmpty()) {
      throw new BadRequestException("CSV file is required");
    }

    long importedNotes = 0;
    long skippedRows = 0;

    try (CSVParser parser = CSVParser.parse(readUtf8(file), CSV_FORMAT)) {
      validateHeaders(parser.getHeaderMap());

      for (CSVRecord record : parser) {
        String content = cleanContent(record.get(HEADER_CONTENT));
        if (content.isBlank()) {
          skippedRows++;
          continue;
        }

        String title = Book.cleanTitle(record.get(HEADER_TITLE));
        String author = Book.cleanAuthor(record.get(HEADER_AUTHOR));
        String sourceHash = sourceHash(title, author, content);

        if (noteRepository.existsBySourceHash(sourceHash)) {
          skippedRows++;
          continue;
        }

        Book book = findOrCreateBook(title, author);
        if (noteRepository.existsByBookAndContent(book, content)) {
          skippedRows++;
          continue;
        }

        Note note = new Note(
            book,
            content,
            record.get(HEADER_CHAPTER),
            record.get(HEADER_REMARK),
            sourceHash);
        noteRepository.save(note);
        importedNotes++;
      }
    } catch (IOException ex) {
      throw new BadRequestException("Could not read CSV file", ex);
    } catch (IllegalArgumentException ex) {
      throw new BadRequestException("CSV file must include headers: " + String.join(", ", REQUIRED_HEADERS), ex);
    }

    return new CsvImportResponse(
        importedNotes,
        skippedRows,
        noteRepository.count(),
        bookRepository.count());
  }

  private Book findOrCreateBook(String title, String author) {
    String normalizedTitle = Book.normalizeKey(title);
    String normalizedAuthor = Book.normalizeKey(author);

    return bookRepository
        .findByNormalizedTitleAndNormalizedAuthor(normalizedTitle, normalizedAuthor)
        .orElseGet(() -> bookRepository.save(new Book(title, author)));
  }

  private void validateHeaders(Map<String, Integer> headers) {
    if (headers == null) {
      throw new BadRequestException("CSV file must include headers: " + String.join(", ", REQUIRED_HEADERS));
    }
    for (String header : REQUIRED_HEADERS) {
      if (!headers.containsKey(header)) {
        throw new BadRequestException("CSV file must include headers: " + String.join(", ", REQUIRED_HEADERS));
      }
    }
  }

  private String readUtf8(MultipartFile file) throws IOException {
    String content = new String(file.getBytes(), StandardCharsets.UTF_8);
    if (content.startsWith("\uFEFF")) {
      return content.substring(1);
    }
    return content;
  }

  private String cleanContent(String value) {
    return value == null ? "" : value.strip();
  }

  private String sourceHash(String title, String author, String content) {
    String material = "%s\u001F%s\u001F%s".formatted(
        Book.normalizeKey(title),
        Book.normalizeKey(author),
        content.strip());
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      return HexFormat.of().formatHex(digest.digest(material.getBytes(StandardCharsets.UTF_8)));
    } catch (NoSuchAlgorithmException ex) {
      throw new IllegalStateException("SHA-256 is unavailable", ex);
    }
  }
}
