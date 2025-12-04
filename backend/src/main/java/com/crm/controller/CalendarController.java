package com.crm.controller;

import com.crm.dto.CalendarEventDto;
import com.crm.entity.User;
import com.crm.service.CalendarService;
import javax.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/calendar")
public class CalendarController {
    private final CalendarService calendarService;

    public CalendarController(CalendarService calendarService) {
        this.calendarService = calendarService;
    }

    @GetMapping
    public ResponseEntity<List<CalendarEventDto>> getAll(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(calendarService.getAll(user.getId()));
    }

    @GetMapping("/range")
    public ResponseEntity<List<CalendarEventDto>> getByDateRange(
            @RequestParam String start,
            @RequestParam String end,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(calendarService.getByDateRange(user.getId(), start, end));
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<CalendarEventDto>> getUpcoming(
            @RequestParam(defaultValue = "10") int limit,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(calendarService.getUpcoming(user.getId(), limit));
    }

    @GetMapping("/today")
    public ResponseEntity<List<CalendarEventDto>> getToday(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(calendarService.getToday(user.getId()));
    }

    @GetMapping("/contact/{contactId}")
    public ResponseEntity<List<CalendarEventDto>> getByContact(@PathVariable String contactId, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(calendarService.getByContact(user.getId(), contactId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CalendarEventDto> getById(@PathVariable String id, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(calendarService.getById(id, user.getId()));
    }

    @PostMapping
    public ResponseEntity<CalendarEventDto> create(@Valid @RequestBody CalendarEventDto dto, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(calendarService.create(dto, user.getId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CalendarEventDto> update(@PathVariable String id, @RequestBody CalendarEventDto dto, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(calendarService.update(id, dto, user.getId()));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Void> cancel(@PathVariable String id, @AuthenticationPrincipal User user) {
        calendarService.cancel(id, user.getId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<CalendarEventDto> complete(@PathVariable String id, @RequestBody(required = false) Map<String, String> body, @AuthenticationPrincipal User user) {
        String notes = body != null ? body.get("notes") : null;
        return ResponseEntity.ok(calendarService.complete(id, user.getId(), notes));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, @AuthenticationPrincipal User user) {
        calendarService.delete(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/export")
    public ResponseEntity<String> exportToIcs(@AuthenticationPrincipal User user) {
        String ics = calendarService.exportToIcs(user.getId());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=calendar.ics")
                .contentType(MediaType.parseMediaType("text/calendar"))
                .body(ics);
    }

    @PostMapping("/import")
    public ResponseEntity<List<CalendarEventDto>> importFromIcs(@RequestBody String icsContent, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(calendarService.importFromIcs(user.getId(), icsContent));
    }
}
