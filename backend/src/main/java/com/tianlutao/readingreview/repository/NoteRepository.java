package com.tianlutao.readingreview.repository;

import com.tianlutao.readingreview.domain.Book;
import com.tianlutao.readingreview.domain.Note;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NoteRepository extends JpaRepository<Note, Long> {

  List<Note> findAllByOrderByCreatedAtDescIdDesc();

  List<Note> findByBookIdOrderByCreatedAtDescIdDesc(Long bookId);

  boolean existsBySourceHash(String sourceHash);

  boolean existsByBookAndContent(Book book, String content);

  long countByBookId(Long bookId);

  long countByBookIdAndFavoriteTrue(Long bookId);
}
