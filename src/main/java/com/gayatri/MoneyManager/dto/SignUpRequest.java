package com.gayatri.MoneyManager.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SignUpRequest {

    @JsonProperty("fullName")   // ← THIS is the fix: accept "fullName" from frontend JSON
    @NotBlank(message = "Full name required")
    @Size(min = 3, max = 100, message = "Name must be 3-100 characters")
    private String fullname;

    @NotBlank(message = "Email required")
    @Email(message = "Enter a valid email")
    private String email;

    @NotBlank(message = "Password required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotBlank(message = "Confirm password required")
    private String confirmPassword;
}