package com.gayatri.MoneyManager.repository;

import com.gayatri.MoneyManager.entity.Budget;
import com.gayatri.MoneyManager.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepo extends JpaRepository<Budget, Long> {

    // Get all budgets for a user in a specific month/year
    List<Budget> findByUserAndMonthAndYear(User user, Integer month, Integer year);

    // Check if budget already exists for same category + month + year
    Optional<Budget> findByUserAndCategoryAndMonthAndYear(
            User user, String category, Integer month, Integer year
    );
}