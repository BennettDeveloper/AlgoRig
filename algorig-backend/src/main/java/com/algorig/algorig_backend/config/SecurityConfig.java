package com.algorig.algorig_backend.config;

import com.algorig.algorig_backend.security.JwtAuthFilter;
import com.algorig.algorig_backend.security.OAuth2SuccessHandler;
import com.algorig.algorig_backend.security.OAuth2UserService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final OAuth2UserService oAuth2UserService;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final CorsConfigurationSource corsConfigurationSource;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .headers(headers -> headers
                .frameOptions(frame -> frame.deny())
                .contentTypeOptions(Customizer.withDefaults())
                .httpStrictTransportSecurity(hsts -> hsts
                    .includeSubDomains(true)
                    .maxAgeInSeconds(31536000)
                )
            )
            .authorizeHttpRequests(auth -> auth
                // Auth endpoints — public
                .requestMatchers(HttpMethod.POST, "/api/auth/register").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                // Robots — fully public read
                .requestMatchers(HttpMethod.GET, "/api/robots/**").permitAll()
                // Individual script — public read (privacy check happens in service)
                .requestMatchers(HttpMethod.GET, "/api/scripts/{id}").permitAll()
                // All public scripts — no auth
                .requestMatchers(HttpMethod.GET, "/api/scripts/public").permitAll()
                // Script validation — no auth (read-only utility)
                .requestMatchers(HttpMethod.POST, "/api/scripts/validate").permitAll()
                // Individual battle — public/private check happens in service
                .requestMatchers(HttpMethod.GET, "/api/battles/{id}").permitAll()
                // Public user profiles — no auth required
                .requestMatchers(HttpMethod.GET, "/api/users/{username}").permitAll()
                // Public script repository — no auth required
                .requestMatchers(HttpMethod.GET, "/api/repository/**").permitAll()
                // OAuth2 flow
                .requestMatchers("/oauth2/**").permitAll()
                .requestMatchers("/login/oauth2/**").permitAll()
                // Everything else requires a valid JWT
                .anyRequest().authenticated()
            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setContentType("application/json");
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.getWriter().write("{\"error\":\"Unauthorized\",\"status\":401}");
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setContentType("application/json");
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.getWriter().write("{\"error\":\"Forbidden\",\"status\":403}");
                })
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .oauth2Login(oauth2 -> oauth2
                .userInfoEndpoint(endpoint -> endpoint.userService(oAuth2UserService))
                .successHandler(oAuth2SuccessHandler)
                .authorizationEndpoint(endpoint -> endpoint.baseUri("/oauth2/authorize"))
                .redirectionEndpoint(endpoint -> endpoint.baseUri("/login/oauth2/code/*"))
            );

        return http.build();
    }

    /**
     * Prevent Spring Boot from auto-registering JwtAuthFilter as a standalone
     * servlet filter (it must only run inside the Spring Security filter chain).
     */
    @Bean
    public FilterRegistrationBean<JwtAuthFilter> jwtFilterRegistration(JwtAuthFilter filter) {
        FilterRegistrationBean<JwtAuthFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
