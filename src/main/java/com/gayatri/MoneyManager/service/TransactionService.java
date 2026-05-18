package com.gayatri.MoneyManager.service;

import com.gayatri.MoneyManager.dto.TransactionRequest;
import com.gayatri.MoneyManager.dto.TransactionResponse;
import com.gayatri.MoneyManager.entity.Transaction;
import com.gayatri.MoneyManager.entity.Transaction.TransactionType;
import com.gayatri.MoneyManager.entity.User;
import com.gayatri.MoneyManager.repository.TransactionRepo;
import com.gayatri.MoneyManager.repository.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.gayatri.MoneyManager.dto.DashboardResponse;
import java.util.Map;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepo transactionRepo;
    private final UserRepo userRepo;

    // ── Helper: load user or throw ──────────────────────────────
    private User getUser(String email) {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // ── Helper: Entity → Response DTO ───────────────────────────
    private TransactionResponse toResponse(Transaction t) {
        return TransactionResponse.builder()
                .id(t.getId())
                .type(t.getType())
                .amount(t.getAmount())
                .category(t.getCategory())
                .date(t.getDate())
                .description(t.getDescription())
                .createdAt(t.getCreatedAt())
                .build();
    }

    // ── CREATE ───────────────────────────────────────────────────
    public TransactionResponse addTransaction(String email, TransactionRequest req) {
        User user = getUser(email);

        // Build entity from request
        Transaction transaction = Transaction.builder()
                .user(user)
                .type(req.getType())
                .amount(req.getAmount())
                .category(req.getCategory())
                .date(req.getDate())
                .description(req.getDescription())
                .build();

        // Save to DB and convert to response
        Transaction saved = transactionRepo.save(transaction);
        return toResponse(saved);
    }

    // ── GET ALL (with optional filters) ─────────────────────────
    public List<TransactionResponse> getTransactions(
            String email,
            TransactionType type,
            LocalDate startDate,
            LocalDate endDate
    ) {
        User user = getUser(email);
        List<Transaction> transactions;

        // Pick the right query based on what filters were provided
        if (type != null && startDate != null && endDate != null) {
            transactions = transactionRepo
                    .findByUserAndTypeAndDateBetweenOrderByDateDesc(
                            user, type, startDate, endDate);

        } else if (type != null) {
            transactions = transactionRepo
                    .findByUserAndTypeOrderByDateDesc(user, type);

        } else if (startDate != null && endDate != null) {
            transactions = transactionRepo
                    .findByUserAndDateBetweenOrderByDateDesc(
                            user, startDate, endDate);

        } else {
            transactions = transactionRepo
                    .findByUserOrderByDateDesc(user);
        }

        // Convert list of entities to list of response DTOs
        return transactions.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ── DELETE ───────────────────────────────────────────────────
    public void deleteTransaction(String email, Long transactionId) {
        User user = getUser(email);

        Transaction transaction = transactionRepo.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        // Security check: make sure this transaction belongs to THIS user
        if (!transaction.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }
        System.out.println("Logged user: " + user.getId());
        System.out.println("Transaction user: " + transaction.getUser().getId());
        transactionRepo.deleteById(transactionId);


    }

    // ── UPDATE ───────────────────────────────────────────────────
    public TransactionResponse updateTransaction(
            String email, Long transactionId, TransactionRequest req
    ) {
        User user = getUser(email);

        Transaction transaction = transactionRepo.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        // Security check
        if (!transaction.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        // Update fields
        transaction.setType(req.getType());
        transaction.setAmount(req.getAmount());
        transaction.setCategory(req.getCategory());
        transaction.setDate(req.getDate());
        transaction.setDescription(req.getDescription());

        Transaction updated = transactionRepo.save(transaction);
        return toResponse(updated);

    }
    // ── EXPORT EXCEL ─────────────────────────────────────────────
    public byte[] exportToExcel(String email) throws Exception {
        User user = getUser(email);
        List<Transaction> transactions = transactionRepo.findByUserOrderByDateDesc(user);

        try (org.apache.poi.xssf.usermodel.XSSFWorkbook workbook =
                     new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {

            org.apache.poi.ss.usermodel.Sheet sheet =
                    workbook.createSheet("Transactions");

            // ── Header row ──────────────────────────────────────
            org.apache.poi.ss.usermodel.Row header = sheet.createRow(0);
            String[] cols = {"ID", "Date", "Type", "Category", "Amount", "Description"};
            for (int i = 0; i < cols.length; i++) {
                header.createCell(i).setCellValue(cols[i]);
            }

            // ── Data rows ───────────────────────────────────────
            int rowNum = 1;
            for (Transaction t : transactions) {
                org.apache.poi.ss.usermodel.Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(t.getId());
                row.createCell(1).setCellValue(t.getDate().toString());
                row.createCell(2).setCellValue(t.getType().name());
                row.createCell(3).setCellValue(t.getCategory());
                row.createCell(4).setCellValue(t.getAmount().doubleValue());
                row.createCell(5).setCellValue(
                        t.getDescription() != null ? t.getDescription() : ""
                );
            }

            // Auto-size columns
            for (int i = 0; i < cols.length; i++) sheet.autoSizeColumn(i);

            java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    // ── EXPORT PDF ───────────────────────────────────────────────
    public byte[] exportToPdf(String email) throws Exception {
        User user = getUser(email);
        List<Transaction> transactions = transactionRepo.findByUserOrderByDateDesc(user);

        java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
        com.itextpdf.text.Document document = new com.itextpdf.text.Document();
        com.itextpdf.text.pdf.PdfWriter.getInstance(document, out);
        document.open();

        // ── Title ───────────────────────────────────────────────
        com.itextpdf.text.Font titleFont = new com.itextpdf.text.Font(
                com.itextpdf.text.Font.FontFamily.HELVETICA, 16,
                com.itextpdf.text.Font.BOLD
        );
        document.add(new com.itextpdf.text.Paragraph(
                "Transaction Report — " + user.getFullname(), titleFont
        ));
        document.add(new com.itextpdf.text.Paragraph(
                "Generated: " + java.time.LocalDate.now()
        ));
        document.add(com.itextpdf.text.Chunk.NEWLINE);

        // ── Table ───────────────────────────────────────────────
        com.itextpdf.text.pdf.PdfPTable table =
                new com.itextpdf.text.pdf.PdfPTable(5);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{2f, 2f, 2f, 1.5f, 2.5f});

        // Header cells
        com.itextpdf.text.Font headerFont = new com.itextpdf.text.Font(
                com.itextpdf.text.Font.FontFamily.HELVETICA, 11,
                com.itextpdf.text.Font.BOLD,
                com.itextpdf.text.BaseColor.WHITE
        );
        String[] headers = {"Date", "Type", "Category", "Amount", "Description"};
        for (String h : headers) {
            com.itextpdf.text.pdf.PdfPCell cell =
                    new com.itextpdf.text.pdf.PdfPCell(
                            new com.itextpdf.text.Phrase(h, headerFont)
                    );
            cell.setBackgroundColor(new com.itextpdf.text.BaseColor(26, 79, 138));
            cell.setPadding(8);
            table.addCell(cell);
        }

        // Data rows
        for (Transaction t : transactions) {
            table.addCell(t.getDate().toString());
            table.addCell(t.getType().name());
            table.addCell(t.getCategory());
            table.addCell("₹" + t.getAmount().toString());
            table.addCell(t.getDescription() != null ? t.getDescription() : "—");
        }

        document.add(table);
        document.close();
        return out.toByteArray();
    }

    // ── DASHBOARD SUMMARY ────────────────────────────────────────
    public DashboardResponse getDashboardSummary(
            String email,
            LocalDate startDate,
            LocalDate endDate
    ) {
        User user = getUser(email);

        // Get all transactions in the date range
        List<Transaction> all = transactionRepo
                .findByUserAndDateBetweenOrderByDateDesc(user, startDate, endDate);

        // ── Top card totals ──────────────────────────────────────
        java.math.BigDecimal totalIncome = all.stream()
                .filter(t -> t.getType() == TransactionType.INCOME)
                .map(Transaction::getAmount)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

        java.math.BigDecimal totalExpenses = all.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE)
                .map(Transaction::getAmount)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

        java.math.BigDecimal totalSavings = all.stream()
                .filter(t -> t.getType() == TransactionType.SAVING)
                .map(Transaction::getAmount)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

        java.math.BigDecimal netBalance = totalIncome.subtract(totalExpenses);

        // ── Monthly trend — last 6 months ────────────────────────
        List<com.gayatri.MoneyManager.dto.DashboardResponse.MonthlyTrend> monthlyTrend =
                new java.util.ArrayList<>();

        // Walk back 6 months from endDate's month
        java.time.LocalDate cursor = endDate.withDayOfMonth(1);
        for (int i = 11; i >= 0; i--) {
            java.time.LocalDate monthStart = cursor.minusMonths(i);
            java.time.LocalDate monthEnd   = monthStart.withDayOfMonth(
                    monthStart.lengthOfMonth()
            );
            String label = monthStart.getMonth()
                    .getDisplayName(java.time.format.TextStyle.SHORT,
                            java.util.Locale.ENGLISH)
                    + " " + String.valueOf(monthStart.getYear()).substring(2);

            List<Transaction> monthTxns = transactionRepo
                    .findByUserAndDateBetweenOrderByDateDesc(
                            user, monthStart, monthEnd);

            java.math.BigDecimal mIncome = monthTxns.stream()
                    .filter(t -> t.getType() == TransactionType.INCOME)
                    .map(Transaction::getAmount)
                    .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

            java.math.BigDecimal mExpenses = monthTxns.stream()
                    .filter(t -> t.getType() == TransactionType.EXPENSE)
                    .map(Transaction::getAmount)
                    .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

            java.math.BigDecimal mSavings = monthTxns.stream()
                    .filter(t -> t.getType() == TransactionType.SAVING)
                    .map(Transaction::getAmount)
                    .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

            monthlyTrend.add(
                    com.gayatri.MoneyManager.dto.DashboardResponse.MonthlyTrend.builder()
                            .month(label)
                            .income(mIncome)
                            .expenses(mExpenses)
                            .savings(mSavings)
                            .build()
            );
        }

        // ── Category flow — top expense categories ────────────────
        Map<String, java.math.BigDecimal> catMap = new java.util.LinkedHashMap<>();
        all.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE)
                .forEach(t -> catMap.merge(
                        t.getCategory(), t.getAmount(), java.math.BigDecimal::add
                ));

        // Sort by amount desc, take top 5
        List<com.gayatri.MoneyManager.dto.DashboardResponse.CategoryFlow> categoryFlow =
                catMap.entrySet().stream()
                        .sorted(Map.Entry.<String, java.math.BigDecimal>comparingByValue()
                                .reversed())
                        .limit(5)
                        .map(e -> {
                            double pct = totalExpenses.compareTo(java.math.BigDecimal.ZERO) == 0
                                    ? 0
                                    : e.getValue()
                                    .divide(totalExpenses, 4, java.math.RoundingMode.HALF_UP)
                                    .multiply(java.math.BigDecimal.valueOf(100))
                                    .doubleValue();
                            return com.gayatri.MoneyManager.dto.DashboardResponse.CategoryFlow
                                    .builder()
                                    .category(e.getKey())
                                    .amount(e.getValue())
                                    .percentage(pct)
                                    .build();
                        })
                        .collect(Collectors.toList());

        // ── Weekly comparison — current month divided into 4 weeks ─
        List<com.gayatri.MoneyManager.dto.DashboardResponse.WeeklyComparison> weekly =
                new java.util.ArrayList<>();

        // Divide the month into 4 roughly equal week buckets
        int daysInMonth = startDate.lengthOfMonth();
        int[][] weekRanges = {
                {1,  7},
                {8,  14},
                {15, 21},
                {22, daysInMonth}
        };

        for (int w = 0; w < 4; w++) {
            LocalDate wStart = startDate.withDayOfMonth(weekRanges[w][0]);
            LocalDate wEnd   = startDate.withDayOfMonth(weekRanges[w][1]);

            java.math.BigDecimal wIncome = all.stream()
                    .filter(t -> t.getType() == TransactionType.INCOME)
                    .filter(t -> !t.getDate().isBefore(wStart) &&
                            !t.getDate().isAfter(wEnd))
                    .map(Transaction::getAmount)
                    .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

            java.math.BigDecimal wExpenses = all.stream()
                    .filter(t -> t.getType() == TransactionType.EXPENSE)
                    .filter(t -> !t.getDate().isBefore(wStart) &&
                            !t.getDate().isAfter(wEnd))
                    .map(Transaction::getAmount)
                    .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

            weekly.add(
                    com.gayatri.MoneyManager.dto.DashboardResponse.WeeklyComparison
                            .builder()
                            .week("W" + (w + 1))
                            .income(wIncome)
                            .expenses(wExpenses)
                            .build()
            );
        }

        // ── Recent 5 transactions ─────────────────────────────────
        List<TransactionResponse> recent = transactionRepo
                .findByUserOrderByDateDesc(user)
                .stream()
                .limit(5)
                .map(this::toResponse)
                .collect(Collectors.toList());

        return DashboardResponse.builder()
                .totalIncome(totalIncome)
                .totalExpenses(totalExpenses)
                .totalSavings(totalSavings)
                .netBalance(netBalance)
                .monthlyTrend(monthlyTrend)
                .categoryFlow(categoryFlow)
                .weeklyComparison(weekly)
                .recentTransactions(recent)
                .build();
    }

    // ── SAVINGS TREND (cumulative month by month) ─────────────────
    public List<java.util.Map<String, Object>> getSavingsTrend(String email) {
        User user = getUser(email);

        java.time.LocalDate today = java.time.LocalDate.now();
        List<java.util.Map<String, Object>> result = new java.util.ArrayList<>();

        java.math.BigDecimal cumulative = java.math.BigDecimal.ZERO;

        // Walk last 12 months oldest → newest
        for (int i = 11; i >= 0; i--) {
            java.time.LocalDate monthStart =
                    today.withDayOfMonth(1).minusMonths(i);
            java.time.LocalDate monthEnd   =
                    monthStart.withDayOfMonth(monthStart.lengthOfMonth());

            String label =
                    monthStart.getMonth()
                            .getDisplayName(java.time.format.TextStyle.SHORT,
                                    java.util.Locale.ENGLISH)
                            + " " + String.valueOf(monthStart.getYear()).substring(2);

            // Sum SAVING transactions this month
            List<Transaction> monthTxns = transactionRepo
                    .findByUserAndDateBetweenOrderByDateDesc(
                            user, monthStart, monthEnd);

            java.math.BigDecimal monthSavings = monthTxns.stream()
                    .filter(t -> t.getType() == TransactionType.SAVING)
                    .map(Transaction::getAmount)
                    .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

            // Add to running total
            cumulative = cumulative.add(monthSavings);

            java.util.Map<String, Object> point = new java.util.LinkedHashMap<>();
            point.put("month",       label);
            point.put("monthlySaved", monthSavings);
            point.put("totalSaved",   cumulative);
            result.add(point);
        }
        return result;
    }
}