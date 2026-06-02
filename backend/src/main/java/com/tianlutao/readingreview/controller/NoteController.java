package com.tianlutao.readingreview.controller;

import com.tianlutao.readingreview.dto.NoteResponse;
import com.tianlutao.readingreview.service.NoteService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notes")
public class NoteController {

  private final NoteService noteService;

  public NoteController(NoteService noteService) {
    this.noteService = noteService;
  }

  @GetMapping
  public List<NoteResponse> listNotes() {
    return noteService.listNotes();
  }

  @GetMapping("/random")
  public NoteResponse randomNote() {
    return noteService.randomNote();
  }

  @PatchMapping("/{id}/favorite")
  public NoteResponse toggleFavorite(@PathVariable Long id) {
    return noteService.toggleFavorite(id);
  }
}
