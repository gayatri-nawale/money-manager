package com.gayatri.MoneyManager.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Links this transaction to a user
    // Many transactions can belong to one user
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // EXPENSE, INCOME, or SAVING
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TransactionType type;

    // The money amount — BigDecimal for precision (never use double for money)
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    // e.g. "Food & Dining", "Salary", "Emergency Fund"
    @Column(nullable = false, length = 100)
    private String category;

    // The date user picked for this transaction
    @Column(nullable = false)
    private LocalDate date;

    // Optional note
    @Column(length = 500)
    private String description;

    // Auto-set when record is created
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Enum lives inside same file — keeps it clean
    public enum TransactionType {
        EXPENSE, INCOME, SAVING
    }
}
