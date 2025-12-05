package com.crm.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_google_tokens")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserGoogleToken {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "access_token", columnDefinition = "TEXT")
    private String accessToken;

    @Column(name = "refresh_token", columnDefinition = "TEXT")
    private String refreshToken;

    @Column(name = "token_expires_at")
    private LocalDateTime tokenExpiresAt;

    @Column(name = "calendar_sync_enabled")
    @Builder.Default
    private boolean calendarSyncEnabled = true;

    @Column(name = "primary_calendar_id")
    private String primaryCalendarId;

    @Column(name = "last_sync_at")
    private LocalDateTime lastSyncAt;

    @Column(name = "sync_status")
    @Builder.Default
    private String syncStatus = "NEVER_SYNCED";

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public boolean isTokenExpired() {
        return tokenExpiresAt != null && LocalDateTime.now().isAfter(tokenExpiresAt);
    }
}
