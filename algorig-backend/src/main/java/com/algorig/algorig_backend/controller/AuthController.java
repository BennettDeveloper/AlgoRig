package com.algorig.algorig_backend.controller;

import com.algorig.algorig_backend.dto.AuthResponseDto;
import com.algorig.algorig_backend.dto.LoginRequestDto;
import com.algorig.algorig_backend.dto.RegisterRequestDto;
import com.algorig.algorig_backend.dto.UserDto;
import com.algorig.algorig_backend.model.entity.User;
import com.algorig.algorig_backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDto> register(@RequestBody @Valid RegisterRequestDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.register(dto));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> login(@RequestBody @Valid LoginRequestDto dto) {
        return ResponseEntity.ok(userService.login(dto));
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> me(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(userService.getProfile(user.getId()));
    }
}
