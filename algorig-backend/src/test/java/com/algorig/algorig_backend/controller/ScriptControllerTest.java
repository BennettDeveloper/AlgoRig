package com.algorig.algorig_backend.controller;

import com.algorig.algorig_backend.dto.ScriptDto;
import com.algorig.algorig_backend.dto.ScriptValidationResultDto;
import com.algorig.algorig_backend.model.entity.User;
import com.algorig.algorig_backend.repository.UserRepository;
import com.algorig.algorig_backend.service.ScriptService;
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

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ScriptControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired JwtUtil jwtUtil;

    @MockitoBean ScriptService scriptService;
    @MockitoBean UserRepository userRepository;

    private static final String SCRIPT_SAVE_JSON = """
            {"name":"TestScript","content":"IF myHP < 50\\n  HardStrike\\nEND IF\\nPatch\\nHeavyAttack"}
            """;

    // -------------------------------------------------------------------------
    // GET /api/scripts/public — permitAll
    // -------------------------------------------------------------------------

    @Test
    void getPublicScripts_noAuth_returns200() throws Exception {
        given(scriptService.getPublicScripts()).willReturn(List.of());

        mockMvc.perform(get("/api/scripts/public"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    // -------------------------------------------------------------------------
    // GET /api/scripts/{id} — permitAll
    // -------------------------------------------------------------------------

    @Test
    void getScript_publicScript_noAuth_returns200() throws Exception {
        given(scriptService.getScript(eq(1L), any()))
                .willReturn(buildScriptDto(1L, "TestScript"));

        mockMvc.perform(get("/api/scripts/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("TestScript"))
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void getScript_privateScriptNoAuth_returns403() throws Exception {
        given(scriptService.getScript(eq(2L), any()))
                .willThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied"));

        mockMvc.perform(get("/api/scripts/2"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getScript_notFound_returns404() throws Exception {
        given(scriptService.getScript(eq(99L), any()))
                .willThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Script not found"));

        mockMvc.perform(get("/api/scripts/99"))
                .andExpect(status().isNotFound());
    }

    // -------------------------------------------------------------------------
    // POST /api/scripts/validate — permitAll
    // -------------------------------------------------------------------------

    @Test
    void validateScript_noAuth_returns200WithValidResult() throws Exception {
        given(scriptService.validateScript(any()))
                .willReturn(ScriptValidationResultDto.builder()
                        .valid(true).errors(List.of()).build());

        mockMvc.perform(post("/api/scripts/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"content":"IF myHP < 50\\n  HardStrike\\nEND IF\\nPatch\\nHeavyAttack"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid").value(true));
    }

    @Test
    void validateScript_invalidScript_returns200WithErrors() throws Exception {
        given(scriptService.validateScript(any()))
                .willReturn(ScriptValidationResultDto.builder()
                        .valid(false).errors(List.of("Script must contain at least 3 actions")).build());

        mockMvc.perform(post("/api/scripts/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"content":"HardStrike"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid").value(false))
                .andExpect(jsonPath("$.errors[0]").exists());
    }

    // -------------------------------------------------------------------------
    // POST /api/scripts — authenticated
    // -------------------------------------------------------------------------

    @Test
    void createScript_authenticated_returns200() throws Exception {
        User user = testUser();
        given(userRepository.findById(1L)).willReturn(Optional.of(user));
        given(scriptService.createScript(any(), any()))
                .willReturn(buildScriptDto(1L, "TestScript"));

        mockMvc.perform(post("/api/scripts")
                        .header("Authorization", bearerToken(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(SCRIPT_SAVE_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("TestScript"));
    }

    @Test
    void createScript_unauthenticated_returns401() throws Exception {
        mockMvc.perform(post("/api/scripts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(SCRIPT_SAVE_JSON))
                .andExpect(status().isUnauthorized());
    }

    // -------------------------------------------------------------------------
    // PUT /api/scripts/{id} — authenticated
    // -------------------------------------------------------------------------

    @Test
    void updateScript_authenticated_returns200() throws Exception {
        User user = testUser();
        given(userRepository.findById(1L)).willReturn(Optional.of(user));
        given(scriptService.updateScript(eq(1L), any(), any()))
                .willReturn(buildScriptDto(1L, "UpdatedScript"));

        mockMvc.perform(put("/api/scripts/1")
                        .header("Authorization", bearerToken(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(SCRIPT_SAVE_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("UpdatedScript"));
    }

    @Test
    void updateScript_unauthenticated_returns401() throws Exception {
        mockMvc.perform(put("/api/scripts/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(SCRIPT_SAVE_JSON))
                .andExpect(status().isUnauthorized());
    }

    // -------------------------------------------------------------------------
    // DELETE /api/scripts/{id} — authenticated
    // -------------------------------------------------------------------------

    @Test
    void deleteScript_authenticated_returns204() throws Exception {
        User user = testUser();
        given(userRepository.findById(1L)).willReturn(Optional.of(user));
        doNothing().when(scriptService).deleteScript(eq(1L), any());

        mockMvc.perform(delete("/api/scripts/1")
                        .header("Authorization", bearerToken(user)))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteScript_unauthenticated_returns401() throws Exception {
        mockMvc.perform(delete("/api/scripts/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deleteScript_notOwner_returns403() throws Exception {
        User user = testUser();
        given(userRepository.findById(1L)).willReturn(Optional.of(user));
        doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your script"))
                .when(scriptService).deleteScript(eq(1L), any());

        mockMvc.perform(delete("/api/scripts/1")
                        .header("Authorization", bearerToken(user)))
                .andExpect(status().isForbidden());
    }

    // -------------------------------------------------------------------------
    // GET /api/scripts — authenticated (user's own scripts)
    // -------------------------------------------------------------------------

    @Test
    void getUserScripts_authenticated_returns200() throws Exception {
        User user = testUser();
        given(userRepository.findById(1L)).willReturn(Optional.of(user));
        given(scriptService.getUserScripts(any())).willReturn(List.of());

        mockMvc.perform(get("/api/scripts")
                        .header("Authorization", bearerToken(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void getUserScripts_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/scripts"))
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

    private ScriptDto buildScriptDto(Long id, String name) {
        return ScriptDto.builder()
                .id(id).name(name).content("IF myHP < 50\n  HardStrike\nEND IF\nPatch\nHeavyAttack")
                .isPublic(true).build();
    }
}
