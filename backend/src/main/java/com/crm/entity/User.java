package com.crm.entity;

import javax.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.GenericGenerator;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @GeneratedValue(generator = "uuid2")
    private String id;

    @Column(unique = true, nullable = false)
    private String email;

    private String passwordHash;
    private String googleId;
    private String name;
    private String profilePicture;
    private String timezone;

    @Column(columnDefinition = "TEXT")
    private String settings;

    // Email verification fields
    private boolean emailVerified = false;
    private String verificationToken;
    private LocalDateTime verificationTokenExpiry;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public User() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getGoogleId() { return googleId; }
    public void setGoogleId(String googleId) { this.googleId = googleId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getProfilePicture() { return profilePicture; }
    public void setProfilePicture(String profilePicture) { this.profilePicture = profilePicture; }
    public String getTimezone() { return timezone; }
    public void setTimezone(String timezone) { this.timezone = timezone; }
    public String getSettings() { return settings; }
    public void setSettings(String settings) { this.settings = settings; }
    public boolean isEmailVerified() { return emailVerified; }
    public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }
    public String getVerificationToken() { return verificationToken; }
    public void setVerificationToken(String verificationToken) { this.verificationToken = verificationToken; }
    public LocalDateTime getVerificationTokenExpiry() { return verificationTokenExpiry; }
    public void setVerificationTokenExpiry(LocalDateTime verificationTokenExpiry) { this.verificationTokenExpiry = verificationTokenExpiry; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final User user = new User();
        public Builder email(String email) { user.email = email; return this; }
        public Builder passwordHash(String hash) { user.passwordHash = hash; return this; }
        public Builder name(String name) { user.name = name; return this; }
        public Builder timezone(String tz) { user.timezone = tz; return this; }
        public Builder settings(String s) { user.settings = s; return this; }
        public Builder profilePicture(String p) { user.profilePicture = p; return this; }
        public Builder googleId(String g) { user.googleId = g; return this; }
        public Builder emailVerified(boolean v) { user.emailVerified = v; return this; }
        public Builder verificationToken(String t) { user.verificationToken = t; return this; }
        public Builder verificationTokenExpiry(LocalDateTime e) { user.verificationTokenExpiry = e; return this; }
        public User build() { return user; }
    }
}
