package com.crm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class GoogleCalendarDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuthUrlResponse {
        private String authUrl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConnectRequest {
        private String code;
        private String redirectUri;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SyncStatus {
        private boolean connected;
        private boolean syncEnabled;
        private LocalDateTime lastSyncAt;
        private String status;
        private String primaryCalendarId;
        private String email;
        private int pendingChanges;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SyncResult {
        private int eventsImported;
        private int eventsExported;
        private int conflicts;
        private LocalDateTime syncedAt;
        private String message;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SyncConflict {
        private String id;
        private String localEventId;
        private String googleEventId;
        private String title;
        private LocalDateTime localModified;
        private LocalDateTime googleModified;
        private String conflictType;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResolveConflictRequest {
        private String resolution; // "local" or "google"
    }
}
