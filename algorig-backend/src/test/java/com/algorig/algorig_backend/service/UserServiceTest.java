package com.algorig.algorig_backend.service;

import com.algorig.algorig_backend.dto.AuthResponseDto;
import com.algorig.algorig_backend.dto.ChangePasswordDto;
import com.algorig.algorig_backend.dto.LoginRequestDto;
import com.algorig.algorig_backend.dto.RegisterRequestDto;
import com.algorig.algorig_backend.model.entity.User;
import com.algorig.algorig_backend.repository.ScriptRepository;
import com.algorig.algorig_backend.repository.UserRepository;
import com.algorig.algorig_backend.util.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    // All 7 constructor deps must be declared; tests only configure the ones they use
    @Mock UserRepository userRepository;
    @Mock JwtUtil jwtUtil;
    @Mock BCryptPasswordEncoder passwordEncoder;
    @Mock UserStatsService userStatsService;
    @Mock AchievementService achievementService;
    @Mock ScriptRepository scriptRepository;
    @Mock CloudinaryService cloudinaryService;

    @InjectMocks UserService userService;

    // -------------------------------------------------------------------------
    // register()
    // -------------------------------------------------------------------------

    @Test
    void register_success_returnsAuthResponse() {
        given(userRepository.existsByEmail("test@test.com")).willReturn(false);
        given(userRepository.existsByUsername("testuser")).willReturn(false);
        given(passwordEncoder.encode("pass1234")).willReturn("hashedPw");
        given(userRepository.save(any())).willAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(1L);
            return u;
        });
        given(jwtUtil.generateToken(any())).willReturn("jwt-token");

        RegisterRequestDto dto = new RegisterRequestDto();
        dto.setUsername("testuser");
        dto.setEmail("test@test.com");
        dto.setPassword("pass1234");

        AuthResponseDto result = userService.register(dto);

        assertEquals("jwt-token", result.getToken());
        assertEquals("testuser", result.getUsername());
        assertEquals("test@test.com", result.getEmail());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_duplicateEmail_throwsConflict() {
        given(userRepository.existsByEmail("taken@test.com")).willReturn(true);

        RegisterRequestDto dto = new RegisterRequestDto();
        dto.setUsername("newuser");
        dto.setEmail("taken@test.com");
        dto.setPassword("pass1234");

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> userService.register(dto));
        assertEquals(409, ex.getStatusCode().value());
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_duplicateUsername_throwsConflict() {
        given(userRepository.existsByEmail(any())).willReturn(false);
        given(userRepository.existsByUsername("taken")).willReturn(true);

        RegisterRequestDto dto = new RegisterRequestDto();
        dto.setUsername("taken");
        dto.setEmail("new@test.com");
        dto.setPassword("pass1234");

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> userService.register(dto));
        assertEquals(409, ex.getStatusCode().value());
        verify(userRepository, never()).save(any());
    }

    // -------------------------------------------------------------------------
    // login()
    // -------------------------------------------------------------------------

    @Test
    void login_success_returnsToken() {
        User user = buildLocalUser(1L, "user@test.com", "hashedPw");
        given(userRepository.findByEmail("user@test.com")).willReturn(Optional.of(user));
        given(passwordEncoder.matches("rawPw", "hashedPw")).willReturn(true);
        given(jwtUtil.generateToken(user)).willReturn("token123");

        LoginRequestDto dto = new LoginRequestDto();
        dto.setEmail("user@test.com");
        dto.setPassword("rawPw");

        AuthResponseDto result = userService.login(dto);
        assertEquals("token123", result.getToken());
        assertEquals(1L, result.getUserId());
    }

    @Test
    void login_wrongPassword_throwsUnauthorized() {
        User user = buildLocalUser(1L, "u@t.com", "hash");
        given(userRepository.findByEmail("u@t.com")).willReturn(Optional.of(user));
        given(passwordEncoder.matches("wrong", "hash")).willReturn(false);

        LoginRequestDto dto = new LoginRequestDto();
        dto.setEmail("u@t.com");
        dto.setPassword("wrong");

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> userService.login(dto));
        assertEquals(401, ex.getStatusCode().value());
    }

    @Test
    void login_userNotFound_throwsUnauthorized() {
        given(userRepository.findByEmail("nobody@test.com")).willReturn(Optional.empty());

        LoginRequestDto dto = new LoginRequestDto();
        dto.setEmail("nobody@test.com");
        dto.setPassword("pw");

        assertThrows(ResponseStatusException.class, () -> userService.login(dto));
    }

    @Test
    void login_oauthOnlyAccount_throwsUnauthorized() {
        // OAuth accounts have no passwordHash — attempting local login must fail
        User oauthUser = User.builder()
                .id(1L).email("g@google.com").provider("google")
                .passwordHash(null).username("guser").build();
        given(userRepository.findByEmail("g@google.com")).willReturn(Optional.of(oauthUser));

        LoginRequestDto dto = new LoginRequestDto();
        dto.setEmail("g@google.com");
        dto.setPassword("anything");

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> userService.login(dto));
        assertEquals(401, ex.getStatusCode().value());
        // Message must reference the OAuth provider, not expose internal details
        assertTrue(ex.getReason().contains("Google") || ex.getReason().contains("GitHub"),
                "Expected OAuth provider mention; got: " + ex.getReason());
    }

    // -------------------------------------------------------------------------
    // changePassword()
    // -------------------------------------------------------------------------

    @Test
    void changePassword_success_updatesHashInDatabase() {
        User user = buildLocalUser(1L, "u@t.com", "oldHash");
        given(userRepository.findById(1L)).willReturn(Optional.of(user));
        given(passwordEncoder.matches("oldPw", "oldHash")).willReturn(true);
        given(passwordEncoder.encode("newPw1234")).willReturn("newHash");

        userService.changePassword(user, new ChangePasswordDto("oldPw", "newPw1234"));

        verify(userRepository).save(user);
        assertEquals("newHash", user.getPasswordHash());
    }

    @Test
    void changePassword_wrongCurrentPassword_throwsUnauthorized() {
        User user = buildLocalUser(1L, "u@t.com", "hash");
        given(userRepository.findById(1L)).willReturn(Optional.of(user));
        given(passwordEncoder.matches("wrongOld", "hash")).willReturn(false);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> userService.changePassword(user, new ChangePasswordDto("wrongOld", "newPw1234")));
        assertEquals(401, ex.getStatusCode().value());
        verify(userRepository, never()).save(any());
    }

    @Test
    void changePassword_oauthAccount_throwsBadRequest() {
        // changePassword re-fetches the user from DB using the passed user's ID
        User oauthUser = User.builder()
                .id(1L).provider("github").passwordHash(null).username("gh").build();
        given(userRepository.findById(1L)).willReturn(Optional.of(oauthUser));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> userService.changePassword(oauthUser, new ChangePasswordDto("any", "newPw1234")));
        assertEquals(400, ex.getStatusCode().value());
    }

    // -------------------------------------------------------------------------
    // Helper
    // -------------------------------------------------------------------------

    private User buildLocalUser(Long id, String email, String passwordHash) {
        return User.builder()
                .id(id)
                .email(email)
                .passwordHash(passwordHash)
                .provider("local")
                .username("user" + id)
                .build();
    }
}
