package com.tianlutao.readingreview.controller;

import com.tianlutao.readingreview.dto.BookSummaryResponse;
import com.tianlutao.readingreview.dto.NoteResponse;
import com.tianlutao.readingreview.service.BookService;
import com.tianlutao.readingreview.service.NoteService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/books")
public class BookController {

  private final BookService bookService;
  private final NoteService noteService;

  public BookController(BookService bookService, NoteService noteService) {
    this.bookService = bookService;
    this.noteService = noteService;
  }

  @GetMapping
  public List<BookSummaryResponse> listBooks() {
    return bookService.listBooks();
  }

  @GetMapping("/{id}/notes")
  public List<NoteResponse> listNotesForBook(@PathVariable Long id) {
    return noteService.listNotesForBook(id);
  }
}
