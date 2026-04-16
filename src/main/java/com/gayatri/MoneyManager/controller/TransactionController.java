package com.gayatri.MoneyManager.controller;

import com.gayatri.MoneyManager.dto.TransactionRequest;
import com.gayatri.MoneyManager.dto.TransactionResponse;
import com.gayatri.MoneyManager.entity.Transaction.TransactionType;
import com.gayatri.MoneyManager.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    // POST /api/transactions
    // Body: { amount, type, category, date, description }
    @PostMapping
    public ResponseEntity<TransactionResponse> add(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody TransactionRequest request
    ) {
        TransactionResponse response = transactionService
                .addTransaction(userDetails.getUsername(), request);
        return ResponseEntity.ok(response);
    }

    // GET /api/transactions
    // Optional params: ?type=EXPENSE&startDate=2024-01-01&endDate=2024-01-31
    @GetMapping
    public ResponseEntity<List<TransactionResponse>> getAll(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        List<TransactionResponse> list = transactionService
                .getTransactions(userDetails.getUsername(), type, startDate, endDate);
        return ResponseEntity.ok(list);
    }

    // PUT /api/transactions/{id}
    @PutMapping("/{id}")
    public ResponseEntity<TransactionResponse> update(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody TransactionRequest request
    ) {
        TransactionResponse response = transactionService
                .updateTransaction(userDetails.getUsername(), id, request);
        return ResponseEntity.ok(response);
    }

    // DELETE /api/transactions/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id
    ) {
        transactionService.deleteTransaction(userDetails.getUsername(), id);
        return ResponseEntity.ok("Deleted successfully");
    }

    // GET /api/transactions/export/excel
    @GetMapping("/export/excel")
    public ResponseEntity<byte[]> exportExcel(
            @AuthenticationPrincipal UserDetails userDetails
    ) throws Exception {
        byte[] data = transactionService.exportToExcel(userDetails.getUsername());
        return ResponseEntity.ok()
                .header("Content-Disposition",
                        "attachment; filename=transactions.xlsx")
                .header("Content-Type",
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .body(data);
    }

    // GET /api/transactions/export/pdf
    @GetMapping("/export/pdf")
    public ResponseEntity<byte[]> exportPdf(
            @AuthenticationPrincipal UserDetails userDetails
    ) throws Exception {
        byte[] data = transactionService.exportToPdf(userDetails.getUsername());
        return ResponseEntity.ok()
                .header("Content-Disposition",
                        "attachment; filename=transactions.pdf")
                .header("Content-Type", "application/pdf")
                .body(data);
    }
}