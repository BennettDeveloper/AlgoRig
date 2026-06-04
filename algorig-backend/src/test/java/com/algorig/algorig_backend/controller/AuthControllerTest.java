package com.algorig.algorig_backend.controller;

import com.algorig.algorig_backend.dto.AuthResponseDto;
import com.algorig.algorig_backend.dto.UserDto;
import com.algorig.algorig_backend.model.entity.User;
import com.algorig.algorig_backend.repository.UserRepository;
import com.algorig.algorig_backend.service.UserService;
import com.algorig.algorig_backend.util.JwtUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired JwtUtil jwtUtil;

    @MockitoBean UserService userService;
    @MockitoBean UserRepository userRepository;

    // -------------------------------------------------------------------------
    // POST /api/auth/register
    // -------------------------------------------------------------------------

    @Test
    void register_validRequest_returns201() throws Exception {
        given(userService.register(any())).willReturn(
                AuthResponseDto.builder()
                        .token("jwt-token").userId(1L)
                        .username("newuser").email("new@test.com")
                        .build());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"newuser","email":"new@test.com","password":"password123"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value("jwt-token"))
                .andExpect(jsonPath("$.username").value("newuser"));
    }

    @Test
    void register_duplicateEmail_returns409() throws Exception {
        given(userService.register(any()))
                .willThrow(new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"user","email":"taken@test.com","password":"password123"}
                                """))
                .andExpect(status().isConflict());
    }

    @Test
    void register_missingUsername_returns400() throws Exception {
        // @NotBlank on username — missing field triggers bean validation
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"u@test.com","password":"password123"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_shortPassword_returns400() throws Exception {
        // @Size(min=8) on password — "short" is 5 chars
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"u","email":"u@test.com","password":"short"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_invalidEmail_returns400() throws Exception {
        // @Email constraint on email field
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"u","email":"not-an-email","password":"password123"}
                                """))
                .andExpect(status().isBadRequest());
    }

    // -------------------------------------------------------------------------
    // POST /api/auth/login
    // -------------------------------------------------------------------------

    @Test
    void login_validCredentials_returns200() throws Exception {
        given(userService.login(any())).willReturn(
                AuthResponseDto.builder()
                        .token("jwt-token").userId(1L)
                        .username("testuser").email("test@test.com")
                        .build());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"test@test.com","password":"password123"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token"));
    }

    @Test
    void login_wrongPassword_returns401() throws Exception {
        given(userService.login(any()))
                .willThrow(new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"test@test.com","password":"wrongpassword"}
                                """))
                .andExpect(status().isUnauthorized());
    }

    // -------------------------------------------------------------------------
    // GET /api/auth/me
    // -------------------------------------------------------------------------

    @Test
    void getMe_withValidToken_returns200() throws Exception {
        User user = testUser();
        given(userRepository.findById(1L)).willReturn(Optional.of(user));
        given(userService.getProfile(1L)).willReturn(
                UserDto.builder().id(1L).username("testuser").email("test@test.com").build());

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", bearerToken(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("testuser"))
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void getMe_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getMe_withInvalidToken_returns401() throws Exception {
        // Invalid JWT does not set authentication — SecurityConfig blocks with 401
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer garbage.token.here"))
                .andExpect(status().isUnauthorized());
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private User testUser() {
        return User.builder()
                .id(1L).username("testuser")
                .email("test@test.com").provider("local")
                .build();
    }

    private String bearerToken(User user) {
        return "Bearer " + jwtUtil.generateToken(user);
    }
}
