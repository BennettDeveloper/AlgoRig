package com.algorig.algorig_backend.controller;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

/**
 * High-priority handler that intercepts ResponseStatusException and Bean Validation
 * errors before GlobalExceptionHandler's generic RuntimeException catch-all.
 */
@RestControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
public class AuthExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleResponseStatus(ResponseStatusException ex) {
        String message = ex.getReason() != null ? ex.getReason() : "Request failed";
        return ResponseEntity.status(ex.getStatusCode())
                .body(Map.of("message", message, "type", "Error"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        List<String> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .toList();
        return ResponseEntity.badRequest()
                .body(Map.of("message", "Validation failed", "errors", errors, "type", "ValidationError"));
    }
}
