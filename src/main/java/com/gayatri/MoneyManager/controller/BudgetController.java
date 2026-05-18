package com.gayatri.MoneyManager.controller;

import com.gayatri.MoneyManager.dto.BudgetRequest;
import com.gayatri.MoneyManager.dto.BudgetResponse;
import com.gayatri.MoneyManager.service.BudgetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService budgetService;

    // GET /api/budgets?month=4&year=2024
    @GetMapping
    public ResponseEntity<List<BudgetResponse>> getBudgets(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam Integer month,
            @RequestParam Integer year
    ) {
        return ResponseEntity.ok(
                budgetService.getBudgets(
                        userDetails.getUsername(), month, year)
        );
    }

    // POST /api/budgets
    @PostMapping
    public ResponseEntity<BudgetResponse> create(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody BudgetRequest request
    ) {
        return ResponseEntity.ok(
                budgetService.createBudget(
                        userDetails.getUsername(), request)
        );
    }

    // PUT /api/budgets/{id}
    @PutMapping("/{id}")
    public ResponseEntity<BudgetResponse> update(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody BudgetRequest request
    ) {
        return ResponseEntity.ok(
                budgetService.updateBudget(
                        userDetails.getUsername(), id, request)
        );
    }

    // DELETE /api/budgets/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id
    ) {
        budgetService.deleteBudget(userDetails.getUsername(), id);
        return ResponseEntity.ok("Budget deleted");
    }
}