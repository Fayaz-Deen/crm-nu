package com.crm.controller;

import com.crm.dto.TagDto;
import com.crm.entity.User;
import com.crm.service.TagService;
import javax.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/tags")
public class TagController {
    private final TagService tagService;

    public TagController(TagService tagService) {
        this.tagService = tagService;
    }

    @GetMapping
    public ResponseEntity<List<TagDto>> getAll(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(tagService.getAll(user.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TagDto> getById(@PathVariable String id, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(tagService.getById(id, user.getId()));
    }

    @PostMapping
    public ResponseEntity<TagDto> create(@Valid @RequestBody TagDto dto, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(tagService.create(dto, user.getId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TagDto> update(@PathVariable String id, @Valid @RequestBody TagDto dto, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(tagService.update(id, dto, user.getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, @AuthenticationPrincipal User user) {
        tagService.delete(id, user.getId());
        return ResponseEntity.noContent().build();
    }
}
