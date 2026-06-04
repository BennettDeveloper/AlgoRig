package com.algorig.algorig_backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Configuration
public class CorsConfig {

    @Value("${cors.allowed-origins:}")
    private String allowedOriginsEnv;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Always allow localhost for dev
        List<String> baseOrigins = List.of(
                "http://localhost:[*]",
                "https://localhost:[*]"
        );

        // Add any origins from environment variable (comma-separated)
        List<String> envOrigins = allowedOriginsEnv.isBlank()
                ? List.of()
                : Arrays.stream(allowedOriginsEnv.split(","))
                .map(String::trim)
                .collect(Collectors.toList());

        List<String> allOrigins = Stream.concat(baseOrigins.stream(), envOrigins.stream())
                .collect(Collectors.toList());

        configuration.setAllowedOriginPatterns(allOrigins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*", "Authorization", "Content-Type"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}