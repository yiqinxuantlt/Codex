package com.tianlutao.readingreview.service;

import com.tianlutao.readingreview.domain.Book;
import com.tianlutao.readingreview.dto.BookSummaryResponse;
import com.tianlutao.readingreview.repository.BookRepository;
import com.tianlutao.readingreview.repository.NoteRepository;
import com.tianlutao.readingreview.repository.ReadingEventRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookService {

  private final BookRepository bookRepository;
  private final NoteRepository noteRepository;
  private final ReadingEventRepository readingEventRepository;

  public BookService(
      BookRepository bookRepository,
      NoteRepository noteRepository,
      ReadingEventRepository readingEventRepository) {
    this.bookRepository = bookRepository;
    this.noteRepository = noteRepository;
    this.readingEventRepository = readingEventRepository;
  }

  @Transactional(readOnly = true)
  public List<BookSummaryResponse> listBooks() {
    return bookRepository.findAllByOrderByTitleAscAuthorAsc().stream()
        .map(this::toSummary)
        .toList();
  }

  private BookSummaryResponse toSummary(Book book) {
    Instant lastViewedAt = readingEventRepository.findLastViewedAtByBookId(book.getId());
    return new BookSummaryResponse(
        book.getId(),
        book.getTitle(),
        book.getAuthor(),
        noteRepository.countByBookId(book.getId()),
        noteRepository.countByBookIdAndFavoriteTrue(book.getId()),
        lastViewedAt);
  }
}
