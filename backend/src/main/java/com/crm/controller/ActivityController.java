package com.crm.controller;

import com.crm.dto.ActivityDto;
import com.crm.entity.User;
import com.crm.service.ActivityService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/activity")
public class ActivityController {
    private final ActivityService activityService;

    public ActivityController(ActivityService activityService) {
        this.activityService = activityService;
    }

    @GetMapping
    public ResponseEntity<List<ActivityDto>> getRecentActivity(
            @RequestParam(defaultValue = "20") int limit,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(activityService.getRecentActivity(user.getId(), limit));
    }

    @GetMapping("/contact/{contactId}")
    public ResponseEntity<List<ActivityDto>> getContactActivity(
            @PathVariable String contactId,
            @RequestParam(defaultValue = "50") int limit,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(activityService.getContactActivity(user.getId(), contactId, limit));
    }
}
