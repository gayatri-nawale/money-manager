package com.gayatri.MoneyManager.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "budgets")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Budget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Which user owns this budget
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // e.g. "Food & Dining"
    @Column(nullable = false, length = 100)
    private String category;

    // The limit user sets manually
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal limitAmount;

    // Month 1-12, Year e.g. 2024
    // Used for monthly reset logic
    @Column(nullable = false)
    private Integer month;

    @Column(nullable = false)
    private Integer year;

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
}