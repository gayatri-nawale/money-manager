package com.gayatri.MoneyManager.controller;

import com.gayatri.MoneyManager.dto.DashboardResponse;
import com.gayatri.MoneyManager.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final TransactionService transactionService;

    // GET /api/dashboard?startDate=2024-01-01&endDate=2024-01-31
    @GetMapping
    public ResponseEntity<DashboardResponse> getDashboard(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate
    ) {
        DashboardResponse response = transactionService.getDashboardSummary(
                userDetails.getUsername(), startDate, endDate
        );
        return ResponseEntity.ok(response);
    }


    // GET /api/dashboard/savings-trend
    @GetMapping("/savings-trend")
    public ResponseEntity<?> getSavingsTrend(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(
                transactionService.getSavingsTrend(userDetails.getUsername())
        );
    }
}