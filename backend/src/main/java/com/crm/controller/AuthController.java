package com.crm.controller;

import com.crm.dto.AuthRequest;
import com.crm.dto.AuthResponse;
import com.crm.entity.User;
import com.crm.repository.UserRepository;
import com.crm.service.AuthService;
import com.crm.service.GoogleAuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import javax.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    private final GoogleAuthService googleAuthService;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public AuthController(AuthService authService, GoogleAuthService googleAuthService,
                          UserRepository userRepository, ObjectMapper objectMapper) {
        this.authService = authService;
        this.googleAuthService = googleAuthService;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(authService.refresh(body.get("refreshToken")));
    }

    /**
     * Authenticate with Google OAuth.
     * Accepts either authorization code or ID token.
     *
     * Request body:
     * - code: Google authorization code (from OAuth redirect)
     * - redirectUri: The redirect URI used in the authorization request
     * OR
     * - idToken: Google ID token (from one-tap sign-in or mobile)
     */
    @PostMapping("/google")
    public ResponseEntity<AuthResponse> googleAuth(@RequestBody Map<String, String> body) {
        String code = body.get("code");
        String idToken = body.get("idToken");
        String redirectUri = body.get("redirectUri");

        if (idToken != null && !idToken.isEmpty()) {
            return ResponseEntity.ok(googleAuthService.authenticateWithIdToken(idToken));
        } else if (code != null && !code.isEmpty()) {
            if (redirectUri == null || redirectUri.isEmpty()) {
                throw new RuntimeException("redirectUri is required when using authorization code");
            }
            return ResponseEntity.ok(googleAuthService.authenticateWithGoogle(code, redirectUri));
        } else {
            throw new RuntimeException("Either code or idToken is required");
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<AuthResponse.UserDto> getProfile(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(AuthResponse.UserDto.from(user));
    }

    @PutMapping("/profile")
    public ResponseEntity<AuthResponse.UserDto> updateProfile(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> updates) {
        if (updates.containsKey("name")) user.setName((String) updates.get("name"));
        if (updates.containsKey("timezone")) user.setTimezone((String) updates.get("timezone"));
        if (updates.containsKey("profilePicture")) user.setProfilePicture((String) updates.get("profilePicture"));
        if (updates.containsKey("settings")) {
            try {
                user.setSettings(objectMapper.writeValueAsString(updates.get("settings")));
            } catch (Exception e) {
                user.setSettings(updates.get("settings").toString());
            }
        }
        return ResponseEntity.ok(AuthResponse.UserDto.from(userRepository.save(user)));
    }

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, String> body) {
        authService.changePassword(user, body.get("currentPassword"), body.get("newPassword"));
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    /**
     * Verify email address using token from verification email.
     */
    @PostMapping("/verify-email")
    public ResponseEntity<Map<String, String>> verifyEmail(@RequestBody Map<String, String> body) {
        authService.verifyEmail(body.get("token"));
        return ResponseEntity.ok(Map.of("message", "Email verified successfully"));
    }

    /**
     * Resend verification email.
     */
    @PostMapping("/resend-verification")
    public ResponseEntity<Map<String, String>> resendVerification(@RequestBody Map<String, String> body) {
        authService.resendVerificationEmail(body.get("email"));
        return ResponseEntity.ok(Map.of("message", "Verification email sent"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody Map<String, String> body) {
        authService.initiatePasswordReset(body.get("email"));
        return ResponseEntity.ok(Map.of("message", "If the email exists, a reset link has been sent"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody Map<String, String> body) {
        authService.resetPassword(body.get("token"), body.get("newPassword"));
        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }

    @DeleteMapping("/account")
    public ResponseEntity<Map<String, String>> deleteAccount(@AuthenticationPrincipal User user) {
        authService.deleteAccount(user);
        return ResponseEntity.ok(Map.of("message", "Account deleted successfully"));
    }
}
