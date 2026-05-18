package com.gayatri.MoneyManager.repository;

import com.gayatri.MoneyManager.entity.Transaction;
import com.gayatri.MoneyManager.entity.Transaction.TransactionType;
import com.gayatri.MoneyManager.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TransactionRepo extends JpaRepository<Transaction, Long> {

    // "find all transactions where user = ? ORDER BY date DESC"
    List<Transaction> findByUserOrderByDateDesc(User user);

    // Filter by type (EXPENSE / INCOME / SAVING)
    List<Transaction> findByUserAndTypeOrderByDateDesc(User user, TransactionType type);

    // Filter by date range
    List<Transaction> findByUserAndDateBetweenOrderByDateDesc(
            User user, LocalDate startDate, LocalDate endDate
    );

    // Filter by type AND date range
    List<Transaction> findByUserAndTypeAndDateBetweenOrderByDateDesc(
            User user, TransactionType type, LocalDate startDate, LocalDate endDate
    );
}