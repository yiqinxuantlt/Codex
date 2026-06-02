package com.tianlutao.readingreview.repository;

import com.tianlutao.readingreview.domain.Book;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookRepository extends JpaRepository<Book, Long> {

  Optional<Book> findByNormalizedTitleAndNormalizedAuthor(
      String normalizedTitle,
      String normalizedAuthor);

  List<Book> findAllByOrderByTitleAscAuthorAsc();
}
