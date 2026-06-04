package com.algorig.algorig_backend.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(OutOfMemoryError.class)
    public ResponseEntity<Map<String, String>> handleOOM(OutOfMemoryError e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
            "message", "Your battle script is too complex. Try simplifying conditions, reducing nesting, or lowering the turn limit.",
            "type", "OutOfMemoryError"
        ));
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<Map<String, String>> handleDataAccessException(DataAccessException e) {
        log.error("Database error: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
            "message", "A database error occurred. Please try again.",
            "type", "DatabaseError"
        ));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException e) {
        String raw = e.getMessage();
        if (raw == null) raw = "";

        if (raw.contains("not found") || raw.contains("Not found")) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "message", "Could not find selected robot or script. Try reloading the page.",
                "type", "NotFound"
            ));
        }
        if (raw.contains("parse") || raw.contains("Parse") || raw.contains("Unexpected token") || raw.contains("Unrecognized")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "message", "There's an issue with your script syntax. Check IF/ELSE blocks and conditions.",
                "type", "ParseError"
            ));
        }
        if (raw.contains("validation") || raw.contains("Validation") || raw.contains("invalid") || raw.contains("Invalid")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "message", "One or more scripts failed validation. Ensure both robots have valid scripts.",
                "type", "ValidationError"
            ));
        }

        log.error("Unhandled runtime error: {}", raw);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
            "message", "Battle could not be started. Please try again.",
            "type", "ServerError"
        ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneral(Exception e) {
        log.error("Unhandled exception: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
            "message", "Server encountered an error. This is temporary. Please try again.",
            "type", "ServerError"
        ));
    }
}
