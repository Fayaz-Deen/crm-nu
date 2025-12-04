package com.crm.service;

import com.crm.dto.AuthResponse;
import com.crm.entity.User;
import com.crm.repository.UserRepository;
import com.crm.security.JwtService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Google OAuth2 Authentication Service.
 *
 * Handles Google Sign-In flow:
 * 1. Frontend redirects user to Google OAuth consent screen
 * 2. Google redirects back with authorization code
 * 3. Frontend sends code to this service
 * 4. This service exchanges code for tokens and user info
 * 5. Creates or updates user account and returns JWT tokens
 */
@Service
public class GoogleAuthService {
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final TemplateService templateService;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String clientId;

    @Value("${spring.security.oauth2.client.registration.google.client-secret}")
    private String clientSecret;

    @Value("${app.google.redirect-uri:}")
    private String redirectUri;

    private static final String TOKEN_URL = "https://oauth2.googleapis.com/token";
    private static final String USER_INFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

    public GoogleAuthService(UserRepository userRepository, JwtService jwtService,
                             TemplateService templateService, ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.templateService = templateService;
        this.objectMapper = objectMapper;
        this.restTemplate = new RestTemplate();
    }

    /**
     * Exchange Google authorization code for user authentication.
     *
     * @param code Authorization code from Google OAuth callback
     * @param redirectUri The redirect URI used in the authorization request
     * @return AuthResponse with JWT tokens and user info
     */
    @Transactional
    public AuthResponse authenticateWithGoogle(String code, String redirectUri) {
        // Exchange authorization code for access token
        String accessToken = exchangeCodeForToken(code, redirectUri);

        // Get user info from Google
        GoogleUserInfo userInfo = getUserInfo(accessToken);

        // Find or create user
        User user = userRepository.findByEmail(userInfo.email)
                .map(existingUser -> updateExistingUser(existingUser, userInfo))
                .orElseGet(() -> createNewUser(userInfo));

        return createAuthResponse(user);
    }

    /**
     * Authenticate using ID token (for mobile apps or one-tap sign-in).
     *
     * @param idToken Google ID token
     * @return AuthResponse with JWT tokens and user info
     */
    @Transactional
    public AuthResponse authenticateWithIdToken(String idToken) {
        // Verify and decode ID token using Google's tokeninfo endpoint
        String tokenInfoUrl = "https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken;

        try {
            ResponseEntity<String> response = restTemplate.getForEntity(tokenInfoUrl, String.class);
            JsonNode tokenInfo = objectMapper.readTree(response.getBody());

            // Verify the token was issued for our client
            String tokenAudience = tokenInfo.has("aud") ? tokenInfo.get("aud").asText() : "";
            if (!tokenAudience.equals(clientId)) {
                throw new RuntimeException("Invalid ID token audience");
            }

            GoogleUserInfo userInfo = new GoogleUserInfo();
            userInfo.id = tokenInfo.has("sub") ? tokenInfo.get("sub").asText() : null;
            userInfo.email = tokenInfo.has("email") ? tokenInfo.get("email").asText() : null;
            userInfo.name = tokenInfo.has("name") ? tokenInfo.get("name").asText() : null;
            userInfo.picture = tokenInfo.has("picture") ? tokenInfo.get("picture").asText() : null;
            userInfo.emailVerified = tokenInfo.has("email_verified") && tokenInfo.get("email_verified").asBoolean();

            if (userInfo.email == null) {
                throw new RuntimeException("Email not provided by Google");
            }

            User user = userRepository.findByEmail(userInfo.email)
                    .map(existingUser -> updateExistingUser(existingUser, userInfo))
                    .orElseGet(() -> createNewUser(userInfo));

            return createAuthResponse(user);
        } catch (Exception e) {
            throw new RuntimeException("Failed to verify ID token: " + e.getMessage());
        }
    }

    private String exchangeCodeForToken(String code, String redirectUri) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("code", code);
        params.add("client_id", clientId);
        params.add("client_secret", clientSecret);
        params.add("redirect_uri", redirectUri);
        params.add("grant_type", "authorization_code");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(TOKEN_URL, request, String.class);
            JsonNode tokenResponse = objectMapper.readTree(response.getBody());

            if (tokenResponse.has("error")) {
                throw new RuntimeException("Google OAuth error: " + tokenResponse.get("error_description").asText());
            }

            return tokenResponse.get("access_token").asText();
        } catch (Exception e) {
            throw new RuntimeException("Failed to exchange code for token: " + e.getMessage());
        }
    }

    private GoogleUserInfo getUserInfo(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        HttpEntity<?> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    USER_INFO_URL, HttpMethod.GET, request, String.class);
            JsonNode userInfoNode = objectMapper.readTree(response.getBody());

            GoogleUserInfo userInfo = new GoogleUserInfo();
            userInfo.id = userInfoNode.has("id") ? userInfoNode.get("id").asText() : null;
            userInfo.email = userInfoNode.has("email") ? userInfoNode.get("email").asText() : null;
            userInfo.name = userInfoNode.has("name") ? userInfoNode.get("name").asText() : null;
            userInfo.picture = userInfoNode.has("picture") ? userInfoNode.get("picture").asText() : null;
            userInfo.emailVerified = userInfoNode.has("verified_email") && userInfoNode.get("verified_email").asBoolean();

            if (userInfo.email == null) {
                throw new RuntimeException("Email not provided by Google");
            }

            return userInfo;
        } catch (Exception e) {
            throw new RuntimeException("Failed to get user info from Google: " + e.getMessage());
        }
    }

    private User updateExistingUser(User user, GoogleUserInfo userInfo) {
        // Link Google account if not already linked
        if (user.getGoogleId() == null) {
            user.setGoogleId(userInfo.id);
        }

        // Update profile picture if user doesn't have one
        if (user.getProfilePicture() == null && userInfo.picture != null) {
            user.setProfilePicture(userInfo.picture);
        }

        // Update name if user doesn't have one
        if (user.getName() == null && userInfo.name != null) {
            user.setName(userInfo.name);
        }

        return userRepository.save(user);
    }

    private User createNewUser(GoogleUserInfo userInfo) {
        User user = User.builder()
                .email(userInfo.email)
                .googleId(userInfo.id)
                .name(userInfo.name)
                .profilePicture(userInfo.picture)
                .timezone(java.util.TimeZone.getDefault().getID())
                .settings("{\"birthdayReminderDays\":2,\"anniversaryReminderDays\":2,\"defaultFollowupDays\":7,\"theme\":\"system\",\"notificationPrefs\":{\"push\":true,\"email\":true}}")
                .emailVerified(true) // Google already verifies emails
                .build();

        user = userRepository.save(user);
        templateService.createDefaultTemplates(user.getId());
        return user;
    }

    private AuthResponse createAuthResponse(User user) {
        String token = jwtService.generateToken(user.getId());
        String refreshToken = jwtService.generateRefreshToken(user.getId());
        return new AuthResponse(token, refreshToken, AuthResponse.UserDto.from(user));
    }

    private static class GoogleUserInfo {
        String id;
        String email;
        String name;
        String picture;
        boolean emailVerified;
    }
}
