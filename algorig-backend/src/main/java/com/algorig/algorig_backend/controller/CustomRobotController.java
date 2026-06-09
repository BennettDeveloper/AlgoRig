package com.algorig.algorig_backend.controller;

import com.algorig.algorig_backend.dto.CustomRobotRequest;
import com.algorig.algorig_backend.dto.CustomRobotResponse;
import com.algorig.algorig_backend.service.CustomRobotService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/custom-robots")
@RequiredArgsConstructor
public class CustomRobotController {

    private final CustomRobotService customRobotService;

    @PostMapping
    public ResponseEntity<CustomRobotResponse> create(
            @RequestBody @Valid CustomRobotRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(customRobotService.createCustomRobot(request));
    }

    @GetMapping("/mine")
    public List<CustomRobotResponse> getMyRobots() {
        return customRobotService.getMyRobots();
    }

    @GetMapping("/{id}")
    public CustomRobotResponse getById(@PathVariable Long id) {
        return customRobotService.getMyRobotById(id);
    }

    @PutMapping("/{id}")
    public CustomRobotResponse update(
            @PathVariable Long id,
            @RequestBody @Valid CustomRobotRequest request) {
        return customRobotService.updateCustomRobot(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        customRobotService.deleteCustomRobot(id);
        return ResponseEntity.noContent().build();
    }

    // ── Local exception handlers ──────────────────────────────────────────────

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage(),
                "type", "ValidationError"
        ));
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(EntityNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "error", e.getMessage(),
                "type", "NotFound"
        ));
    }
}
