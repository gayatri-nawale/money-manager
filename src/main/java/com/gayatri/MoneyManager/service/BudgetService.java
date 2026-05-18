package com.gayatri.MoneyManager.service;

import com.gayatri.MoneyManager.dto.BudgetRequest;
import com.gayatri.MoneyManager.dto.BudgetResponse;
import com.gayatri.MoneyManager.entity.Budget;
import com.gayatri.MoneyManager.entity.Transaction;
import com.gayatri.MoneyManager.entity.User;
import com.gayatri.MoneyManager.repository.BudgetRepo;
import com.gayatri.MoneyManager.repository.TransactionRepo;
import com.gayatri.MoneyManager.repository.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepo budgetRepo;
    private final TransactionRepo transactionRepo;
    private final UserRepo userRepo;

    // ── Helper: get user ─────────────────────────────────────────
    private User getUser(String email) {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // ── Helper: calculate how much was spent in a category
    //           for a specific month/year from transactions ────────
    private BigDecimal calculateSpent(User user, String category,
                                      Integer month, Integer year) {
        // Get first and last day of the month
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end   = start.withDayOfMonth(start.lengthOfMonth());

        // Get all EXPENSE transactions in that date range
        List<Transaction> transactions =
                transactionRepo.findByUserAndDateBetweenOrderByDateDesc(
                        user, start, end
                );

        // Sum up only transactions that match the category
        return transactions.stream()
                .filter(t -> t.getType() ==
                        Transaction.TransactionType.EXPENSE)
                .filter(t -> t.getCategory().equalsIgnoreCase(category))
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    // ── Helper: Entity → Response DTO ────────────────────────────
    private BudgetResponse toResponse(Budget b, User user) {
        BigDecimal spent     = calculateSpent(
                user, b.getCategory(), b.getMonth(), b.getYear()
        );
        BigDecimal limit     = b.getLimitAmount();
        BigDecimal remaining = limit.subtract(spent);
        double pct = limit.compareTo(BigDecimal.ZERO) == 0 ? 0 :
                spent.divide(limit, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .doubleValue();

        return BudgetResponse.builder()
                .id(b.getId())
                .category(b.getCategory())
                .limitAmount(limit)
                .spentAmount(spent)
                .remainingAmount(remaining)
                .percentageUsed(Math.min(pct, 100.0))
                .isOverLimit(spent.compareTo(limit) > 0)
                .month(b.getMonth())
                .year(b.getYear())
                .build();
    }

    // ── GET all budgets for month/year ────────────────────────────
    public List<BudgetResponse> getBudgets(
            String email, Integer month, Integer year) {
        User user = getUser(email);
        return budgetRepo.findByUserAndMonthAndYear(user, month, year)
                .stream()
                .map(b -> toResponse(b, user))
                .collect(Collectors.toList());
    }

    // ── CREATE ────────────────────────────────────────────────────
    public BudgetResponse createBudget(String email, BudgetRequest req) {
        User user = getUser(email);

        // Prevent duplicate category in same month
        budgetRepo.findByUserAndCategoryAndMonthAndYear(
                user, req.getCategory(), req.getMonth(), req.getYear()
        ).ifPresent(b -> {
            throw new RuntimeException(
                    "Budget for '" + req.getCategory() + "' already exists this month"
            );
        });

        Budget budget = Budget.builder()
                .user(user)
                .category(req.getCategory())
                .limitAmount(req.getLimitAmount())
                .month(req.getMonth())
                .year(req.getYear())
                .build();

        Budget saved = budgetRepo.save(budget);
        return toResponse(saved, user);
    }

    // ── UPDATE ────────────────────────────────────────────────────
    public BudgetResponse updateBudget(
            String email, Long id, BudgetRequest req) {
        User user = getUser(email);

        Budget budget = budgetRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Budget not found"));

        if (!budget.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        budget.setCategory(req.getCategory());
        budget.setLimitAmount(req.getLimitAmount());

        Budget updated = budgetRepo.save(budget);
        return toResponse(updated, user);
    }

    // ── DELETE ────────────────────────────────────────────────────
    public void deleteBudget(String email, Long id) {
        User user = getUser(email);

        Budget budget = budgetRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Budget not found"));

        if (!budget.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        budgetRepo.deleteById(id);
    }
}