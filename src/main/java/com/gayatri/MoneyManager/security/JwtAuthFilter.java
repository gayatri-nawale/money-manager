// ──────────────────────────────────────────────────────────────
// This filter runs ONCE per HTTP request.
// It checks the Authorization header for a JWT token.
// If valid → it sets the user as authenticated in Spring's context.
//
// Flow:
//   Request arrives
//   → Filter checks: Authorization: Bearer <token>
//   → Extracts email from token
//   → Loads user from DB
//   → Tells Spring Security "this user is authenticated"
//   → Request continues to the controller
// ──────────────────────────────────────────────────────────────

package com.gayatri.MoneyManager.security;
import com.gayatri.MoneyManager.service.UserDetailsServiceCustom;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtil;
    private final UserDetailsServiceCustom userDetailsService;




    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String path = request.getRequestURI();
        if (
                path.equals("/api/auth/signup") ||
                        path.equals("/api/auth/signin") ||
                        path.equals("/api/auth/forgot-password") ||
                        path.equals("/api/auth/verify-otp")
        ) {
            filterChain.doFilter(request, response);
            return;
        }
        // 1. Get the Authorization header
        String authHeader = request.getHeader("Authorization");

        // 2. Check if it starts with "Bearer "
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response); // no token → continue without auth
            return;
        }

        // 3. Extract the token (remove "Bearer " prefix)
        String token = authHeader.substring(7);

        // 4. Validate token and extract email
        if (jwtUtil.isTokenValid(token)) {
            String email = jwtUtil.extractEmail(token);

            // 5. Only process if no existing authentication
            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {

                // 6. Load full user details from DB
                UserDetails userDetails = userDetailsService.loadUserByUsername(email);

                // 7. Create authentication token for Spring Security
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,                          // credentials (not needed after login)
                                userDetails.getAuthorities()   // roles/permissions
                        );

                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // 8. Tell Spring Security this user is authenticated
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        // 9. Continue to the next filter / controller
        filterChain.doFilter(request, response);
    }
}