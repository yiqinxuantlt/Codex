package com.tianlutao.readingreview.repository;

import com.tianlutao.readingreview.domain.ReadingEvent;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.Nullable;

public interface ReadingEventRepository extends JpaRepository<ReadingEvent, Long> {

  @Query("select count(distinct event.note.id) from ReadingEvent event where event.note is not null")
  long countDistinctViewedNotes();

  @Query("select coalesce(sum(event.durationSeconds), 0) from ReadingEvent event")
  long sumDurationSeconds();

  List<ReadingEvent> findTop10ByOrderByViewedAtDescIdDesc();

  List<ReadingEvent> findByViewedAtGreaterThanEqualOrderByViewedAtAscIdAsc(Instant viewedAt);

  @Nullable
  @Query("select max(event.viewedAt) from ReadingEvent event where event.note.book.id = :bookId")
  Instant findLastViewedAtByBookId(@Param("bookId") Long bookId);
}
