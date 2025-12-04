package com.crm.service;

import com.crm.dto.AuthRequest;
import com.crm.dto.AuthResponse;
import com.crm.entity.User;
import com.crm.repository.ContactRepository;
import com.crm.repository.MeetingRepository;
import com.crm.repository.ReminderRepository;
import com.crm.repository.UserRepository;
import com.crm.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final ContactRepository contactRepository;
    private final MeetingRepository meetingRepository;
    private final ReminderRepository reminderRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TemplateService templateService;
    private final EmailService emailService;

    public AuthService(UserRepository userRepository, ContactRepository contactRepository,
                       MeetingRepository meetingRepository, ReminderRepository reminderRepository,
                       PasswordEncoder passwordEncoder, JwtService jwtService,
                       TemplateService templateService, EmailService emailService) {
        this.userRepository = userRepository;
        this.contactRepository = contactRepository;
        this.meetingRepository = meetingRepository;
        this.reminderRepository = reminderRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.templateService = templateService;
        this.emailService = emailService;
    }

    @Transactional
    public AuthResponse register(AuthRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        // Generate verification token
        String verificationToken = UUID.randomUUID().toString();
        LocalDateTime tokenExpiry = LocalDateTime.now().plusHours(24);

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .timezone(java.util.TimeZone.getDefault().getID())
                .settings("{\"birthdayReminderDays\":2,\"anniversaryReminderDays\":2,\"defaultFollowupDays\":7,\"theme\":\"system\",\"notificationPrefs\":{\"push\":true,\"email\":true}}")
                .birthday(request.getBirthday() != null && !request.getBirthday().isEmpty() ? LocalDate.parse(request.getBirthday()) : null)
                .anniversary(request.getAnniversary() != null && !request.getAnniversary().isEmpty() ? LocalDate.parse(request.getAnniversary()) : null)
                .emailVerified(false)
                .verificationToken(verificationToken)
                .verificationTokenExpiry(tokenExpiry)
                .build();

        user = userRepository.save(user);
        templateService.createDefaultTemplates(user.getId());

        // Send verification email
        emailService.sendVerificationEmail(user.getEmail(), user.getName(), verificationToken);

        return createAuthResponse(user);
    }

    /**
     * Verify user's email address.
     */
    @Transactional
    public void verifyEmail(String token) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid verification token"));

        if (user.getVerificationTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Verification token has expired");
        }

        user.setEmailVerified(true);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiry(null);
        userRepository.save(user);
    }

    /**
     * Resend verification email.
     */
    @Transactional
    public void resendVerificationEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.isEmailVerified()) {
            throw new RuntimeException("Email is already verified");
        }

        // Generate new verification token
        String verificationToken = UUID.randomUUID().toString();
        LocalDateTime tokenExpiry = LocalDateTime.now().plusHours(24);

        user.setVerificationToken(verificationToken);
        user.setVerificationTokenExpiry(tokenExpiry);
        userRepository.save(user);

        emailService.sendVerificationEmail(user.getEmail(), user.getName(), verificationToken);
    }

    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid credentials");
        }

        return createAuthResponse(user);
    }

    public AuthResponse refresh(String refreshToken) {
        if (!jwtService.isTokenValid(refreshToken)) {
            throw new RuntimeException("Invalid refresh token");
        }
        String userId = jwtService.extractUserId(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return createAuthResponse(user);
    }

    public void changePassword(User user, String currentPassword, String newPassword) {
        if (user.getPasswordHash() == null) {
            throw new RuntimeException("Cannot change password for OAuth-only accounts");
        }

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new RuntimeException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public String initiatePasswordReset(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getPasswordHash() == null) {
            throw new RuntimeException("Cannot reset password for OAuth-only accounts");
        }

        String resetToken = UUID.randomUUID().toString();
        return resetToken;
    }

    public void resetPassword(String token, String newPassword) {
        throw new RuntimeException("Password reset requires email service integration");
    }

    @Transactional
    public void deleteAccount(User user) {
        reminderRepository.findByUserIdAndStatus(user.getId(),
            com.crm.entity.Reminder.ReminderStatus.PENDING).forEach(reminderRepository::delete);
        meetingRepository.findByUserId(user.getId()).forEach(meetingRepository::delete);
        contactRepository.findByUserId(user.getId()).forEach(contactRepository::delete);
        userRepository.delete(user);
    }

    private AuthResponse createAuthResponse(User user) {
        String token = jwtService.generateToken(user.getId());
        String refreshToken = jwtService.generateRefreshToken(user.getId());
        return new AuthResponse(token, refreshToken, AuthResponse.UserDto.from(user));
    }
}
