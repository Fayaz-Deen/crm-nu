package com.crm.dto;

import com.crm.entity.User;

public class AuthResponse {
    private String token;
    private String refreshToken;
    private UserDto user;

    public AuthResponse(String token, String refreshToken, UserDto user) {
        this.token = token; this.refreshToken = refreshToken; this.user = user;
    }

    public String getToken() { return token; }
    public String getRefreshToken() { return refreshToken; }
    public UserDto getUser() { return user; }

    public static class UserDto {
        private String id;
        private String email;
        private String name;
        private String profilePicture;
        private String timezone;
        private String settings;
        private boolean emailVerified;

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getProfilePicture() { return profilePicture; }
        public void setProfilePicture(String p) { this.profilePicture = p; }
        public String getTimezone() { return timezone; }
        public void setTimezone(String t) { this.timezone = t; }
        public String getSettings() { return settings; }
        public void setSettings(String s) { this.settings = s; }
        public boolean isEmailVerified() { return emailVerified; }
        public void setEmailVerified(boolean v) { this.emailVerified = v; }

        public static UserDto from(User user) {
            UserDto dto = new UserDto();
            dto.setId(user.getId());
            dto.setEmail(user.getEmail());
            dto.setName(user.getName());
            dto.setProfilePicture(user.getProfilePicture());
            dto.setTimezone(user.getTimezone());
            dto.setSettings(user.getSettings());
            dto.setEmailVerified(user.isEmailVerified());
            return dto;
        }
    }
}
