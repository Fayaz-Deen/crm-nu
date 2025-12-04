package com.crm.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Email service for sending verification and notification emails.
 *
 * Configuration required in application.yml:
 * spring:
 *   mail:
 *     host: smtp.gmail.com (or your SMTP provider)
 *     port: 587
 *     username: your-email@gmail.com
 *     password: your-app-password
 *     properties:
 *       mail.smtp.auth: true
 *       mail.smtp.starttls.enable: true
 */
@Service
public class EmailService {
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@nu-connect.com}")
    private String fromEmail;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Send email verification link to new user.
     *
     * @param toEmail Recipient email address
     * @param name User's name
     * @param verificationToken Token for email verification
     */
    public void sendVerificationEmail(String toEmail, String name, String verificationToken) {
        String verificationLink = frontendUrl + "/verify-email?token=" + verificationToken;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("Verify your Nu-Connect account");
        message.setText(
            "Hi " + (name != null ? name : "there") + ",\n\n" +
            "Welcome to Nu-Connect! Please verify your email address by clicking the link below:\n\n" +
            verificationLink + "\n\n" +
            "This link will expire in 24 hours.\n\n" +
            "If you didn't create an account with Nu-Connect, you can safely ignore this email.\n\n" +
            "Best regards,\n" +
            "The Nu-Connect Team"
        );

        try {
            mailSender.send(message);
        } catch (Exception e) {
            // Log error but don't fail registration
            System.err.println("Failed to send verification email: " + e.getMessage());
        }
    }

    /**
     * Send password reset email.
     *
     * @param toEmail Recipient email address
     * @param name User's name
     * @param resetToken Token for password reset
     */
    public void sendPasswordResetEmail(String toEmail, String name, String resetToken) {
        String resetLink = frontendUrl + "/reset-password?token=" + resetToken;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("Reset your Nu-Connect password");
        message.setText(
            "Hi " + (name != null ? name : "there") + ",\n\n" +
            "We received a request to reset your password. Click the link below to set a new password:\n\n" +
            resetLink + "\n\n" +
            "This link will expire in 1 hour.\n\n" +
            "If you didn't request a password reset, you can safely ignore this email.\n\n" +
            "Best regards,\n" +
            "The Nu-Connect Team"
        );

        try {
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send password reset email: " + e.getMessage());
        }
    }
}
