package com.gayatri.MoneyManager.service;

import com.gayatri.MoneyManager.entity.User;
import com.gayatri.MoneyManager.repository.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceCustom implements UserDetailsService {

    private final UserRepo userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        // Find user in DB by email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

        // Return Spring's UserDetails object
        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),           // username = email
                user.getPassword(),    // hashed password
                List.of(new SimpleGrantedAuthority("ROLE_USER")) // roles
        );
    }
}