package com.gayatri.MoneyManager.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {

    // ── Top cards ─────────────────────────────────────────────
    private BigDecimal totalIncome;
    private BigDecimal totalExpenses;
    private BigDecimal totalSavings;
    private BigDecimal netBalance;   // income - expenses

    // ── Spending trend — last 6 months ────────────────────────
    // [ { month: "Jan", income: 4000, expenses: 1200, savings: 500 } ]
    private List<MonthlyTrend> monthlyTrend;

    // ── Category flow — top expense categories ────────────────
    // [ { category: "Food & Dining", amount: 2100 } ]
    private List<CategoryFlow> categoryFlow;

    // ── Weekly income vs expenses (current month) ─────────────
    // [ { week: "W1", income: 3000, expenses: 800 } ]
    private List<WeeklyComparison> weeklyComparison;

    // ── Recent 5 transactions ─────────────────────────────────
    private List<TransactionResponse> recentTransactions;

    // ── Inner classes (data shapes for charts) ────────────────
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class MonthlyTrend {
        private String month;       // "Jan 24"
        private BigDecimal income;
        private BigDecimal expenses;
        private BigDecimal savings;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CategoryFlow {
        private String category;
        private BigDecimal amount;
        private Double percentage;  // % of total expenses
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class WeeklyComparison {
        private String week;        // "W1", "W2", "W3", "W4"
        private BigDecimal income;
        private BigDecimal expenses;
    }
}