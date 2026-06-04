package com.algorig.algorig_backend.controller;

import com.algorig.algorig_backend.dto.BattleDto;
import com.algorig.algorig_backend.model.entity.User;
import com.algorig.algorig_backend.repository.UserRepository;
import com.algorig.algorig_backend.service.BattleService;
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
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BattleControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired JwtUtil jwtUtil;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean BattleService battleService;
    @MockitoBean UserRepository userRepository;

    private static final String VALID_BATTLE_CODE = "BATTLE-ABCDE-FGHIJ";
    private static final String BATTLE_REQUEST_JSON = """
            {"robotAId":1,"robotBId":2,"scriptAId":1,"scriptBId":2,"maxTurns":200}
            """;

    // -------------------------------------------------------------------------
    // POST /api/battles — authenticated only
    // -------------------------------------------------------------------------

    @Test
    void startBattle_authenticated_returns200() throws Exception {
        User user = testUser();
        given(userRepository.findById(1L)).willReturn(Optional.of(user));
        given(battleService.startBattle(any(), any()))
                .willReturn(buildBattleDto(VALID_BATTLE_CODE));

        mockMvc.perform(post("/api/battles")
                        .header("Authorization", bearerToken(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(BATTLE_REQUEST_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.battleCode").value(VALID_BATTLE_CODE));
    }

    @Test
    void startBattle_unauthenticated_returns401() throws Exception {
        mockMvc.perform(post("/api/battles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(BATTLE_REQUEST_JSON))
                .andExpect(status().isUnauthorized());
    }

    // -------------------------------------------------------------------------
    // GET /api/battles/{battleCode} — permitAll
    // -------------------------------------------------------------------------

    @Test
    void getBattle_publicBattle_noAuth_returns200() throws Exception {
        given(battleService.getBattle(eq(VALID_BATTLE_CODE), any()))
                .willReturn(buildBattleDto(VALID_BATTLE_CODE));

        mockMvc.perform(get("/api/battles/" + VALID_BATTLE_CODE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.battleCode").value(VALID_BATTLE_CODE));
    }

    @Test
    void getBattle_privateBattle_noOwnerAuth_returns403() throws Exception {
        given(battleService.getBattle(any(), any()))
                .willThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied"));

        mockMvc.perform(get("/api/battles/BATTLE-XXXXX-XXXXX"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getBattle_notFound_returns404() throws Exception {
        given(battleService.getBattle(any(), any()))
                .willThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Battle not found"));

        mockMvc.perform(get("/api/battles/BATTLE-ZZZZZ-ZZZZZ"))
                .andExpect(status().isNotFound());
    }

    // -------------------------------------------------------------------------
    // GET /api/battles — authenticated only
    // -------------------------------------------------------------------------

    @Test
    void getUserBattles_authenticated_returns200WithArray() throws Exception {
        User user = testUser();
        given(userRepository.findById(1L)).willReturn(Optional.of(user));
        given(battleService.getUserBattles(any()))
                .willReturn(List.of(buildBattleDto(VALID_BATTLE_CODE)));

        mockMvc.perform(get("/api/battles")
                        .header("Authorization", bearerToken(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].battleCode").value(VALID_BATTLE_CODE));
    }

    @Test
    void getUserBattles_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/battles"))
                .andExpect(status().isUnauthorized());
    }

    // -------------------------------------------------------------------------
    // battleCode format verification via POST response
    // -------------------------------------------------------------------------

    @Test
    void startBattle_response_battleCodeHasCorrectFormat() throws Exception {
        User user = testUser();
        given(userRepository.findById(1L)).willReturn(Optional.of(user));
        given(battleService.startBattle(any(), any()))
                .willReturn(buildBattleDto(VALID_BATTLE_CODE));

        MvcResult result = mockMvc.perform(post("/api/battles")
                        .header("Authorization", bearerToken(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(BATTLE_REQUEST_JSON))
                .andExpect(status().isOk())
                .andReturn();

        BattleDto parsed = objectMapper.readValue(
                result.getResponse().getContentAsString(), BattleDto.class);
        assertNotNull(parsed.getBattleCode());
        assertTrue(parsed.getBattleCode().startsWith("BATTLE-"),
                "battleCode must start with 'BATTLE-'");
        assertTrue(parsed.getBattleCode().length() <= 20,
                "battleCode must fit in VARCHAR(20)");
        assertEquals(18, parsed.getBattleCode().length(),
                "BATTLE-XXXXX-XXXXX is always 18 characters");
    }

    @Test
    void getBattle_battleCodeSurvivesRoundTrip() throws Exception {
        // Verify the battleCode field is correctly serialized and can be looked up
        given(battleService.getBattle(eq(VALID_BATTLE_CODE), any()))
                .willReturn(buildBattleDto(VALID_BATTLE_CODE));

        mockMvc.perform(get("/api/battles/" + VALID_BATTLE_CODE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.battleCode").value(VALID_BATTLE_CODE))
                .andExpect(jsonPath("$.id").value(1));
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

    private BattleDto buildBattleDto(String battleCode) {
        return BattleDto.builder()
                .id(1L)
                .battleCode(battleCode)
                .winnerId("A")
                .totalTurns(10)
                .robotAId(1L)
                .robotBId(2L)
                .build();
    }
}
