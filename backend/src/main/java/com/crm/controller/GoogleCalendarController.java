package com.crm.controller;

import com.crm.dto.GoogleCalendarDto;
import com.crm.entity.User;
import com.crm.service.GoogleCalendarSyncService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/calendar/google")
@RequiredArgsConstructor
@Tag(name = "Google Calendar", description = "Google Calendar integration endpoints")
public class GoogleCalendarController {

    private final GoogleCalendarSyncService syncService;

    @GetMapping("/auth-url")
    @Operation(summary = "Get Google OAuth authorization URL")
    public ResponseEntity<GoogleCalendarDto.AuthUrlResponse> getAuthUrl(
            @RequestParam(defaultValue = "") String redirectUri) {

        if (redirectUri.isEmpty()) {
            redirectUri = "http://localhost:3000/settings?tab=integrations";
        }

        String authUrl = syncService.getAuthorizationUrl(redirectUri);
        return ResponseEntity.ok(GoogleCalendarDto.AuthUrlResponse.builder()
                .authUrl(authUrl)
                .build());
    }

    @PostMapping("/connect")
    @Operation(summary = "Connect Google Calendar with authorization code")
    public ResponseEntity<GoogleCalendarDto.SyncStatus> connect(
            @AuthenticationPrincipal User user,
            @RequestBody GoogleCalendarDto.ConnectRequest request) {

        String redirectUri = request.getRedirectUri();
        if (redirectUri == null || redirectUri.isEmpty()) {
            redirectUri = "http://localhost:3000/settings?tab=integrations";
        }

        GoogleCalendarDto.SyncStatus status = syncService.connect(user, request.getCode(), redirectUri);
        return ResponseEntity.ok(status);
    }

    @PostMapping("/disconnect")
    @Operation(summary = "Disconnect Google Calendar")
    public ResponseEntity<Void> disconnect(@AuthenticationPrincipal User user) {
        syncService.disconnect(user);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/status")
    @Operation(summary = "Get Google Calendar sync status")
    public ResponseEntity<GoogleCalendarDto.SyncStatus> getStatus(@AuthenticationPrincipal User user) {
        GoogleCalendarDto.SyncStatus status = syncService.getSyncStatus(user);
        return ResponseEntity.ok(status);
    }

    @PostMapping("/sync")
    @Operation(summary = "Trigger manual sync with Google Calendar")
    public ResponseEntity<GoogleCalendarDto.SyncResult> triggerSync(@AuthenticationPrincipal User user) {
        GoogleCalendarDto.SyncResult result = syncService.triggerSync(user);
        return ResponseEntity.ok(result);
    }
}
