package com.gayatri.MoneyManager.repository;
import com.gayatri.MoneyManager.entity.OtpToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface OtpTokensRepo extends JpaRepository<OtpToken,Long> {
    // Find latest unused OTP for this email
    Optional<OtpToken> findTopByEmailAndIsUsedFalseOrderByCreatedAtDesc(String email);

    // Delete all old OTPs for this email (cleanup before sending new one)
    void deleteAllByEmail(String email);
}
