package com.tianlutao.readingreview.service;

import com.tianlutao.readingreview.domain.Book;
import com.tianlutao.readingreview.domain.Note;
import com.tianlutao.readingreview.dto.NoteResponse;
import com.tianlutao.readingreview.exception.ResourceNotFoundException;
import com.tianlutao.readingreview.repository.BookRepository;
import com.tianlutao.readingreview.repository.NoteRepository;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NoteService {

  private final NoteRepository noteRepository;
  private final BookRepository bookRepository;

  public NoteService(NoteRepository noteRepository, BookRepository bookRepository) {
    this.noteRepository = noteRepository;
    this.bookRepository = bookRepository;
  }

  @Transactional(readOnly = true)
  public List<NoteResponse> listNotes() {
    return noteRepository.findAllByOrderByCreatedAtDescIdDesc().stream()
        .map(this::toResponse)
        .toList();
  }

  @Transactional(readOnly = true)
  public NoteResponse randomNote() {
    long totalNotes = noteRepository.count();
    if (totalNotes == 0) {
      throw new ResourceNotFoundException("No notes available");
    }

    int randomPage = ThreadLocalRandom.current().nextInt((int) Math.min(totalNotes, Integer.MAX_VALUE));
    return noteRepository.findAll(PageRequest.of(randomPage, 1, Sort.by(Sort.Direction.ASC, "id"))).stream()
        .findFirst()
        .map(this::toResponse)
        .orElseThrow(() -> new ResourceNotFoundException("No notes available"));
  }

  @Transactional
  public NoteResponse toggleFavorite(Long id) {
    Note note = noteRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Note not found: " + id));
    note.toggleFavorite();
    return toResponse(note);
  }

  @Transactional(readOnly = true)
  public List<NoteResponse> listNotesForBook(Long bookId) {
    if (!bookRepository.existsById(bookId)) {
      throw new ResourceNotFoundException("Book not found: " + bookId);
    }
    return noteRepository.findByBookIdOrderByCreatedAtDescIdDesc(bookId).stream()
        .map(this::toResponse)
        .toList();
  }

  NoteResponse toResponse(Note note) {
    Book book = note.getBook();
    return new NoteResponse(
        note.getId(),
        note.getContent(),
        book.getTitle(),
        book.getAuthor(),
        note.getChapterName(),
        note.getRemark(),
        note.isFavorite(),
        note.getCreatedAt());
  }
}
