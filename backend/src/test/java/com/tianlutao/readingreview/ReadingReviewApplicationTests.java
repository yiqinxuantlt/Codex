package com.tianlutao.readingreview;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ReadingReviewApplicationTests {

  private final MockMvc mockMvc;

  @Autowired
  ReadingReviewApplicationTests(MockMvc mockMvc) {
    this.mockMvc = mockMvc;
  }

  @Test
  void coreApisImportNotesAndRecordReadingEvents() throws Exception {
    mockMvc.perform(get("/api/health"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("ok"));

    MockMultipartFile csv = new MockMultipartFile(
        "file",
        "notes.csv",
        "text/csv",
        """
        书名,作者,章节名称,笔记内容,备注
        Clean Code,Robert C. Martin,Chapter 1,"Names can include commas, and
        line breaks.",Good reminder
        Clean Code,Robert C. Martin,Chapter 1,"Names can include commas, and
        line breaks.",Duplicate
        Refactoring,Martin Fowler,Chapter 2,Small steps make changes safer,
        """.getBytes(StandardCharsets.UTF_8));

    mockMvc.perform(multipart("/api/import/csv").file(csv))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.importedNotes").value(2))
        .andExpect(jsonPath("$.skippedRows").value(1))
        .andExpect(jsonPath("$.totalNotes").value(2))
        .andExpect(jsonPath("$.totalBooks").value(2));

    long firstNoteId = 1L;
    mockMvc.perform(get("/api/notes"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].content").exists())
        .andExpect(jsonPath("$[0].bookTitle").exists())
        .andExpect(jsonPath("$[0].favorite").value(false));

    mockMvc.perform(get("/api/notes/random"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(greaterThanOrEqualTo(1)));

    mockMvc.perform(patch("/api/notes/{id}/favorite", firstNoteId))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.favorite").value(true));

    mockMvc.perform(get("/api/books"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].noteCount").value(1))
        .andExpect(jsonPath("$[0].favoriteCount").value(1));

    mockMvc.perform(get("/api/books/{id}/notes", 1L))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].bookTitle").exists());

    mockMvc.perform(post("/api/reading-events")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"noteId": 1, "durationSeconds": 30}
                """))
        .andExpect(status().isNoContent());

    mockMvc.perform(get("/api/reading-records/summary"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalViews").value(1))
        .andExpect(jsonPath("$.uniqueNotesViewed").value(1))
        .andExpect(jsonPath("$.totalDurationSeconds").value(30))
        .andExpect(jsonPath("$.averageDurationSeconds").value(30.0))
        .andExpect(jsonPath("$.recentEvents[0].contentPreview", containsString("Names can include commas")));

    mockMvc.perform(get("/api/reading-records/daily").param("days", "7"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(7)))
        .andExpect(jsonPath("$[6].views").value(1))
        .andExpect(jsonPath("$[6].durationSeconds").value(30));
  }
}
