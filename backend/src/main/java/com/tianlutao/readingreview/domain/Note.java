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
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "notes")
public class Note {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "book_id", nullable = false)
  private Book book;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String content;

  @Column(name = "chapter_name", length = 500)
  private String chapterName;

  @Column(columnDefinition = "TEXT")
  private String remark;

  @Column(nullable = false)
  private boolean favorite;

  @Column(name = "source_hash", length = 64, unique = true)
  private String sourceHash;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected Note() {
  }

  public Note(Book book, String content, String chapterName, String remark, String sourceHash) {
    if (book == null) {
      throw new IllegalArgumentException("Book is required");
    }
    String cleanedContent = cleanRequired(content);
    if (cleanedContent.isBlank()) {
      throw new IllegalArgumentException("Note content is required");
    }
    this.book = book;
    this.content = cleanedContent;
    this.chapterName = cleanOptional(chapterName);
    this.remark = cleanOptional(remark);
    this.sourceHash = cleanOptional(sourceHash);
    this.favorite = false;
  }

  public Long getId() {
    return id;
  }

  public Book getBook() {
    return book;
  }

  public String getContent() {
    return content;
  }

  public String getChapterName() {
    return chapterName;
  }

  public String getRemark() {
    return remark;
  }

  public boolean isFavorite() {
    return favorite;
  }

  public String getSourceHash() {
    return sourceHash;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public void toggleFavorite() {
    favorite = !favorite;
  }

  private static String cleanRequired(String value) {
    return value == null ? "" : value.strip();
  }

  private static String cleanOptional(String value) {
    if (value == null) {
      return null;
    }
    String cleaned = value.strip();
    return cleaned.isBlank() ? null : cleaned;
  }
}
