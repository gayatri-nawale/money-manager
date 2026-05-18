package com.gayatri.MoneyManager.dto;

import lombok.*;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetResponse {

    private Long id;
    private String category;
    private BigDecimal limitAmount;

    // Calculated from transactions for this month
    private BigDecimal spentAmount;

    // limitAmount - spentAmount (can be negative = over limit)
    private BigDecimal remainingAmount;

    // Percentage spent (spentAmount / limitAmount * 100)
    private Double percentageUsed;

    // true if spentAmount > limitAmount
    private Boolean isOverLimit;

    private Integer month;
    private Integer year;
}