package com.tianlutao.readingreview.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import java.util.Locale;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(
    name = "books",
    uniqueConstraints = {
      @UniqueConstraint(
          name = "uk_books_normalized_title_author",
          columnNames = {"normalized_title", "normalized_author"})
    })
public class Book {

  public static final String DEFAULT_TITLE = "Untitled";

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 500)
  private String title;

  @Column(nullable = false, length = 500)
  private String author;

  @Column(name = "normalized_title", nullable = false, length = 500)
  private String normalizedTitle;

  @Column(name = "normalized_author", nullable = false, length = 500)
  private String normalizedAuthor;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected Book() {
  }

  public Book(String title, String author) {
    updateTitleAndAuthor(title, author);
  }

  public Long getId() {
    return id;
  }

  public String getTitle() {
    return title;
  }

  public String getAuthor() {
    return author;
  }

  public String getNormalizedTitle() {
    return normalizedTitle;
  }

  public String getNormalizedAuthor() {
    return normalizedAuthor;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public void updateTitleAndAuthor(String title, String author) {
    this.title = cleanTitle(title);
    this.author = cleanAuthor(author);
    refreshNormalizedFields();
  }

  public static String cleanTitle(String value) {
    String cleaned = cleanDisplayValue(value);
    return cleaned.isBlank() ? DEFAULT_TITLE : cleaned;
  }

  public static String cleanAuthor(String value) {
    return cleanDisplayValue(value);
  }

  public static String normalizeKey(String value) {
    return cleanDisplayValue(value).toLowerCase(Locale.ROOT);
  }

  @PrePersist
  @PreUpdate
  void refreshNormalizedFields() {
    normalizedTitle = normalizeKey(title);
    normalizedAuthor = normalizeKey(author);
  }

  private static String cleanDisplayValue(String value) {
    if (value == null) {
      return "";
    }
    return value.strip().replaceAll("\\s+", " ");
  }
}
