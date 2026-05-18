package com.gayatri.MoneyManager.service;

import com.gayatri.MoneyManager.dto.*;
import com.gayatri.MoneyManager.entity.OtpToken;
import com.gayatri.MoneyManager.entity.User;
import com.gayatri.MoneyManager.repository.OtpTokensRepo;
import com.gayatri.MoneyManager.repository.UserRepo;
import com.gayatri.MoneyManager.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;   // ← ADD THIS

import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Transactional          // ← ADD THIS — wraps every method in a transaction
public class AuthService {

    private final UserRepo userRepository;
    private final OtpTokensRepo otpTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    public AuthResponse signup(SignUpRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Passwords do not match");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }
        User user = User.builder()
                .fullname(request.getFullname())
                .email(request.getEmail().toLowerCase().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .isVerfied(true)
                .build();
        User savedUser = userRepository.save(user);
        String token = jwtUtil.generateToken(savedUser.getEmail());
        return AuthResponse.builder()
                .token(token)
                .message("Account created")
                .user(mapToUserDto(savedUser))
                .build();
    }

    // signin needs to be read-only=false (default) but NOT wrapped
    // with the JPA transaction because authenticationManager does its own thing
    // So mark it Transactional separately:
    @Transactional(noRollbackFor = AuthenticationException.class)
    public AuthResponse signin(SigninRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );
        } catch (AuthenticationException e) {
            throw new RuntimeException("Invalid email or password");
        }
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));
        String token = jwtUtil.generateToken(user.getEmail());
        return AuthResponse.builder()
                .token(token)
                .message("Signed in successfully")
                .user(mapToUserDto(user))
                .build();
    }

    public String sendOtp(String email) {
        userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No account found with this email"));

        // Now works because class-level @Transactional is active
        otpTokenRepository.deleteAllByEmail(email);

        String otp = String.format("%06d", new Random().nextInt(999999));

        OtpToken otpToken = OtpToken.builder()
                .email(email)
                .otpcode(otp)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .isUsed(false)
                .build();

        otpTokenRepository.save(otpToken);
        emailService.sendOtpEmail(email, otp);

        return "OTP sent to " + email;
    }
    @Transactional
    public void deleteUser(String email) {
        userRepository.deleteByEmail(email);
    }
    public String verifyOtpAndResetPassword(VerifyOtpRequest request) {
        OtpToken otpToken = otpTokenRepository
                .findTopByEmailAndIsUsedFalseOrderByCreatedAtDesc(request.getEmail())
                .orElseThrow(() -> new RuntimeException("No OTP found. Request a new one."));

        if (!otpToken.getOtpcode().equals(request.getOtp())) {
            throw new RuntimeException("Invalid OTP");
        }

        if (LocalDateTime.now().isAfter(otpToken.getExpiresAt())) {
            throw new RuntimeException("OTP expired. Request a new one.");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Passwords do not match");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        otpToken.setUsed(true);
        otpTokenRepository.save(otpToken);

        return "Password reset successful";
    }

    public UserDto getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToUserDto(user);
    }

    public UserDto updateName(String email, String newName) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setFullname(newName);
        userRepository.save(user);
        return mapToUserDto(user);
    }

    private UserDto mapToUserDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .fullname(user.getFullname())
                .email(user.getEmail())
                .createdAt(user.getCreatedAt())
                .build();
    }
}