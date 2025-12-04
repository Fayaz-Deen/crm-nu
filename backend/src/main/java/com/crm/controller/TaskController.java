package com.crm.controller;

import com.crm.dto.TaskDto;
import com.crm.entity.User;
import com.crm.service.TaskService;
import javax.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {
    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public ResponseEntity<List<TaskDto>> getAll(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(taskService.getAll(user.getId()));
    }

    @GetMapping("/active")
    public ResponseEntity<List<TaskDto>> getActive(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(taskService.getActive(user.getId()));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<TaskDto>> getByStatus(@PathVariable String status, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(taskService.getByStatus(user.getId(), status));
    }

    @GetMapping("/contact/{contactId}")
    public ResponseEntity<List<TaskDto>> getByContact(@PathVariable String contactId, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(taskService.getByContact(user.getId(), contactId));
    }

    @GetMapping("/overdue")
    public ResponseEntity<List<TaskDto>> getOverdue(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(taskService.getOverdue(user.getId()));
    }

    @GetMapping("/today")
    public ResponseEntity<List<TaskDto>> getDueToday(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(taskService.getDueToday(user.getId()));
    }

    @GetMapping("/stats")
    public ResponseEntity<TaskService.TaskStatsDto> getStats(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(taskService.getStats(user.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskDto> getById(@PathVariable String id, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(taskService.getById(id, user.getId()));
    }

    @PostMapping
    public ResponseEntity<TaskDto> create(@Valid @RequestBody TaskDto dto, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(taskService.create(dto, user.getId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskDto> update(@PathVariable String id, @RequestBody TaskDto dto, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(taskService.update(id, dto, user.getId()));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<TaskDto> complete(@PathVariable String id, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(taskService.complete(id, user.getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, @AuthenticationPrincipal User user) {
        taskService.delete(id, user.getId());
        return ResponseEntity.noContent().build();
    }
}
