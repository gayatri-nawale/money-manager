package com.gayatri.MoneyManager.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    // ── Send OTP email for password reset ────────────────────
    public void sendOtpEmail(String toEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("MoneyManager – Password Reset OTP");
        message.setText(
                "Hello,\n\n" +
                        "Your OTP for password reset is: " + otp + "\n\n" +
                        "This code is valid for 10 minutes.\n" +
                        "If you did not request this, please ignore this email.\n\n" +
                        "– MoneyManager Team"
        );

        mailSender.send(message);
    }
}
