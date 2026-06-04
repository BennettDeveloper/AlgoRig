package com.algorig.algorig_backend.controller;

import com.algorig.algorig_backend.dto.AuthResponseDto;
import com.algorig.algorig_backend.dto.BattleDto;
import com.algorig.algorig_backend.dto.ScriptDto;
import com.algorig.algorig_backend.repository.UserRepository;
import com.algorig.algorig_backend.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Regression guard: verifies that every protected endpoint returns 401 without
 * a token, and every public endpoint returns 2xx without a token.
 *
 * A new endpoint that is accidentally left unprotected will cause the
 * protected-endpoint assertion to fail, catching the mistake before production.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityEnforcementTest {

    @Autowired MockMvc mockMvc;

    // Mock all service beans and the UserRepository so:
    // (a) public-endpoint tests return stubbed data instead of 500
    // (b) JwtAuthFilter can look up users for auth (unused here — no tokens sent)
    @MockitoBean UserService userService;
    @MockitoBean BattleService battleService;
    @MockitoBean ScriptService scriptService;
    @MockitoBean RepositoryService repositoryService;
    @MockitoBean RobotService robotService;
    @MockitoBean AchievementService achievementService;
    @MockitoBean UserRepository userRepository;

    @BeforeEach
    void stubPublicEndpoints() {
        // Stub all public-endpoint service calls so they return valid (if empty) responses
        // rather than Mockito default null, which would cause 500 from Jackson serialization
        given(robotService.getAllRobots()).willReturn(List.of());
        given(scriptService.getPublicScripts()).willReturn(List.of());
        given(scriptService.getScript(eq(1L), any()))
                .willReturn(ScriptDto.builder().id(1L).name("S").isPublic(true).build());
        given(battleService.getBattle(eq("BATTLE-ABCDE-FGHIJ"), any()))
                .willReturn(BattleDto.builder().id(1L).battleCode("BATTLE-ABCDE-FGHIJ").build());
        given(repositoryService.getPublicScripts(any(), any(), any(), anyInt(), anyBoolean(), any()))
                .willReturn(new PageImpl<>(List.of()));
        given(userService.register(any()))
                .willReturn(AuthResponseDto.builder().token("t").userId(1L)
                        .username("u").email("u@t.com").build());
        given(userService.login(any()))
                .willReturn(AuthResponseDto.builder().token("t").userId(1L)
                        .username("u").email("u@t.com").build());
    }

    // =========================================================================
    // PROTECTED ENDPOINTS — must return 401 without a token
    // =========================================================================

    @Test
    void postBattles_withoutToken_returns401() throws Exception {
        mockMvc.perform(post("/api/battles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getBattles_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/battles"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void postScripts_withoutToken_returns401() throws Exception {
        mockMvc.perform(post("/api/scripts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void putScripts_withoutToken_returns401() throws Exception {
        mockMvc.perform(put("/api/scripts/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deleteScripts_withoutToken_returns401() throws Exception {
        mockMvc.perform(delete("/api/scripts/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getMyScripts_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/scripts"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getMe_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // PUBLIC ENDPOINTS — must return 2xx without any token
    // =========================================================================

    @Test
    void getRobots_withoutToken_returns200() throws Exception {
        mockMvc.perform(get("/api/robots"))
                .andExpect(status().isOk());
    }

    @Test
    void getPublicScripts_withoutToken_returns200() throws Exception {
        mockMvc.perform(get("/api/scripts/public"))
                .andExpect(status().isOk());
    }

    @Test
    void getScriptById_withoutToken_returns200() throws Exception {
        mockMvc.perform(get("/api/scripts/1"))
                .andExpect(status().isOk());
    }

    @Test
    void getBattleByCode_withoutToken_returns200() throws Exception {
        mockMvc.perform(get("/api/battles/BATTLE-ABCDE-FGHIJ"))
                .andExpect(status().isOk());
    }

    @Test
    void getRepository_withoutToken_returns200() throws Exception {
        mockMvc.perform(get("/api/repository"))
                .andExpect(status().isOk());
    }

    @Test
    void register_withoutToken_returns201() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"newuser","email":"new@test.com","password":"password123"}
                                """))
                .andExpect(status().isCreated());
    }

    @Test
    void login_withoutToken_returns200() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"u@test.com","password":"password123"}
                                """))
                .andExpect(status().isOk());
    }
}
