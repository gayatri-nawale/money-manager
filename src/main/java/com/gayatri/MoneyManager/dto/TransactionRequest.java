package com.gayatri.MoneyManager.dto;

import com.gayatri.MoneyManager.entity.Transaction.TransactionType;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class TransactionRequest {

    // @NotNull = field must exist
    // @DecimalMin = amount must be > 0
    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    private BigDecimal amount;

    @NotNull(message = "Type is required")
    private TransactionType type;  // EXPENSE, INCOME, or SAVING

    @NotBlank(message = "Category is required")
    @Size(max = 100, message = "Category too long")
    private String category;

    @NotNull(message = "Date is required")
    private LocalDate date;

    // Optional — no validation needed
    @Size(max = 500, message = "Description too long")
    private String description;
}