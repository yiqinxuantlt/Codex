package com.tianlutao.readingreview.service;

import com.tianlutao.readingreview.domain.Note;
import com.tianlutao.readingreview.domain.ReadingEvent;
import com.tianlutao.readingreview.dto.ReadingEventRequest;
import com.tianlutao.readingreview.dto.ReadingSummaryResponse;
import com.tianlutao.readingreview.dto.ReadingSummaryResponse.RecentEventResponse;
import com.tianlutao.readingreview.exception.BadRequestException;
import com.tianlutao.readingreview.exception.ResourceNotFoundException;
import com.tianlutao.readingreview.repository.NoteRepository;
import com.tianlutao.readingreview.repository.ReadingEventRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReadingService {

  private static final int CONTENT_PREVIEW_LIMIT = 120;

  private final ReadingEventRepository readingEventRepository;
  private final NoteRepository noteRepository;

  public ReadingService(ReadingEventRepository readingEventRepository, NoteRepository noteRepository) {
    this.readingEventRepository = readingEventRepository;
    this.noteRepository = noteRepository;
  }

  @Transactional
  public void recordEvent(ReadingEventRequest request) {
    if (request.durationSeconds() == null || request.durationSeconds() < 0) {
      throw new BadRequestException("durationSeconds must be greater than or equal to 0");
    }

    Note note = null;
    if (request.noteId() != null) {
      note = noteRepository.findById(request.noteId())
          .orElseThrow(() -> new ResourceNotFoundException("Note not found: " + request.noteId()));
    }

    readingEventRepository.save(new ReadingEvent(note, request.durationSeconds()));
  }

  @Transactional(readOnly = true)
  public ReadingSummaryResponse summary() {
    long totalViews = readingEventRepository.count();
    long uniqueNotesViewed = readingEventRepository.countDistinctViewedNotes();
    long totalDurationSeconds = readingEventRepository.sumDurationSeconds();
    double averageDurationSeconds = totalViews == 0 ? 0.0 : (double) totalDurationSeconds / totalViews;
    List<RecentEventResponse> recentEvents = readingEventRepository.findTop10ByOrderByViewedAtDescIdDesc().stream()
        .map(this::toRecentEvent)
        .toList();

    return new ReadingSummaryResponse(
        totalViews,
        uniqueNotesViewed,
        totalDurationSeconds,
        averageDurationSeconds,
        recentEvents);
  }

  private RecentEventResponse toRecentEvent(ReadingEvent event) {
    Note note = event.getNote();
    if (note == null) {
      return new RecentEventResponse(
          null,
          null,
          null,
          event.getViewedAt(),
          event.getDurationSeconds());
    }

    return new RecentEventResponse(
        note.getId(),
        note.getBook().getTitle(),
        preview(note.getContent()),
        event.getViewedAt(),
        event.getDurationSeconds());
  }

  private String preview(String content) {
    String compact = content.replaceAll("\\s+", " ").strip();
    if (compact.length() <= CONTENT_PREVIEW_LIMIT) {
      return compact;
    }
    return compact.substring(0, CONTENT_PREVIEW_LIMIT - 3) + "...";
  }
}
