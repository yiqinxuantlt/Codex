package com.tianlutao.readingreview.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "reading_events")
public class ReadingEvent {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "note_id")
  private Note note;

  @Column(name = "viewed_at", nullable = false, updatable = false)
  private Instant viewedAt;

  @Column(name = "duration_seconds", nullable = false)
  private int durationSeconds;

  protected ReadingEvent() {
  }

  public ReadingEvent(Note note, int durationSeconds) {
    if (durationSeconds < 0) {
      throw new IllegalArgumentException("Duration must be non-negative");
    }
    this.note = note;
    this.durationSeconds = durationSeconds;
    this.viewedAt = Instant.now();
  }

  public Long getId() {
    return id;
  }

  public Note getNote() {
    return note;
  }

  public Instant getViewedAt() {
    return viewedAt;
  }

  public int getDurationSeconds() {
    return durationSeconds;
  }
}
