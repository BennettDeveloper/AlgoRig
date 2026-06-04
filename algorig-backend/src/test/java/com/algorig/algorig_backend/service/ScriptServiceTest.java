package com.algorig.algorig_backend.service;

import com.algorig.algorig_backend.dto.ScriptDto;
import com.algorig.algorig_backend.dto.ScriptSaveRequestDto;
import com.algorig.algorig_backend.model.entity.Robot;
import com.algorig.algorig_backend.model.entity.Script;
import com.algorig.algorig_backend.model.entity.User;
import com.algorig.algorig_backend.repository.RobotRepository;
import com.algorig.algorig_backend.repository.ScriptRepository;
import com.algorig.algorig_backend.repository.ScriptUpdateHistoryRepository;
import com.algorig.algorig_backend.validation.ScriptValidator;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;

import org.mockito.ArgumentCaptor;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ScriptServiceTest {

    @Mock ScriptRepository scriptRepository;
    @Mock ScriptValidator scriptValidator;
    @Mock ScriptUpdateHistoryRepository scriptUpdateHistoryRepository;
    @Mock RobotRepository robotRepository;
    @Mock ScriptStatsService scriptStatsService;

    @InjectMocks ScriptService scriptService;

    // -------------------------------------------------------------------------
    // createScript()
    // -------------------------------------------------------------------------

    @Test
    void createScript_setsOwnerAndDefaultsToPublic() {
        User owner = buildUser(1L, "owner");
        given(scriptRepository.save(any())).willAnswer(inv -> {
            Script s = inv.getArgument(0);
            s.setId(1L);
            return s;
        });

        ScriptSaveRequestDto dto = new ScriptSaveRequestDto("MyScript", "HardStrike", null);
        scriptService.createScript(dto, owner);

        ArgumentCaptor<Script> captor = ArgumentCaptor.forClass(Script.class);
        verify(scriptRepository).save(captor.capture());
        assertEquals(owner.getId(), captor.getValue().getOwner().getId());
        assertTrue(captor.getValue().isPublic());
    }

    @Test
    void createScript_savesUpdateHistoryEntry() {
        given(scriptRepository.save(any())).willAnswer(inv -> {
            Script s = inv.getArgument(0);
            s.setId(1L);
            return s;
        });

        scriptService.createScript(
                new ScriptSaveRequestDto("S", "content", null),
                buildUser(1L, "u"));

        verify(scriptUpdateHistoryRepository).save(any());
    }

    @Test
    void createScript_returnsCorrectName() {
        given(scriptRepository.save(any())).willAnswer(inv -> {
            Script s = inv.getArgument(0);
            s.setId(1L);
            return s;
        });

        ScriptDto result = scriptService.createScript(
                new ScriptSaveRequestDto("NamedScript", "content", null),
                buildUser(1L, "u"));

        assertEquals("NamedScript", result.getName());
    }

    // -------------------------------------------------------------------------
    // updateScript() — stats-reset gating
    // -------------------------------------------------------------------------

    @Test
    void updateScript_contentChanged_resetsStats() {
        Script existing = buildScript(1L, "old content", buildUser(1L, "u"));
        given(scriptRepository.findById(1L)).willReturn(Optional.of(existing));
        given(scriptRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

        ScriptSaveRequestDto dto = new ScriptSaveRequestDto("name", "new content", null);
        scriptService.updateScript(1L, dto, buildUser(1L, "u"));

        verify(scriptStatsService).resetStats(any(), any());
    }

    @Test
    void updateScript_nameOnlyChanged_doesNotResetStats() {
        Script existing = buildScript(1L, "same content", buildUser(1L, "u"));
        given(scriptRepository.findById(1L)).willReturn(Optional.of(existing));
        given(scriptRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

        // Only the name differs; content and requirements are identical
        ScriptSaveRequestDto dto = new ScriptSaveRequestDto("new name", "same content", null);
        scriptService.updateScript(1L, dto, buildUser(1L, "u"));

        verify(scriptStatsService, never()).resetStats(any(), any());
    }

    @Test
    void updateScript_requirementsChanged_resetsStats() {
        Script existing = buildScript(1L, "content", buildUser(1L, "u"));
        // Start with no required robots; adding one changes requirements
        existing.setRequiredRobots(new HashSet<>());
        given(scriptRepository.findById(1L)).willReturn(Optional.of(existing));
        given(scriptRepository.save(any())).willAnswer(inv -> inv.getArgument(0));
        given(robotRepository.findAllById(any())).willReturn(List.of(buildRobot(5L)));

        ScriptSaveRequestDto dto = new ScriptSaveRequestDto("name", "content", List.of(5L));
        scriptService.updateScript(1L, dto, buildUser(1L, "u"));

        verify(scriptStatsService).resetStats(any(), any());
    }

    @Test
    void updateScript_notOwner_throws403() {
        User owner = buildUser(1L, "owner");
        User other = buildUser(2L, "other");
        Script script = buildScript(1L, "content", owner);
        given(scriptRepository.findById(1L)).willReturn(Optional.of(script));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> scriptService.updateScript(1L,
                        new ScriptSaveRequestDto("n", "c", null), other));
        assertEquals(403, ex.getStatusCode().value());
        verify(scriptRepository, never()).save(any());
    }

    // -------------------------------------------------------------------------
    // deleteScript()
    // -------------------------------------------------------------------------

    @Test
    void deleteScript_owner_deletesSuccessfully() {
        User owner = buildUser(1L, "owner");
        Script script = buildScript(1L, "content", owner);
        given(scriptRepository.findById(1L)).willReturn(Optional.of(script));

        scriptService.deleteScript(1L, owner);

        verify(scriptRepository).delete(script);
    }

    @Test
    void deleteScript_notOwner_throws403() {
        User owner = buildUser(1L, "owner");
        User other = buildUser(2L, "other");
        Script script = buildScript(1L, "content", owner);
        given(scriptRepository.findById(1L)).willReturn(Optional.of(script));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> scriptService.deleteScript(1L, other));
        assertEquals(403, ex.getStatusCode().value());
        verify(scriptRepository, never()).delete(any());
    }

    @Test
    void deleteScript_notFound_throws404() {
        given(scriptRepository.findById(99L)).willReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> scriptService.deleteScript(99L, buildUser(1L, "u")));
        assertEquals(404, ex.getStatusCode().value());
    }

    // -------------------------------------------------------------------------
    // getScript()
    // -------------------------------------------------------------------------

    @Test
    void getScript_privateScript_notOwner_throws403() {
        User owner = buildUser(1L, "owner");
        User other = buildUser(2L, "other");
        Script script = buildScript(1L, "content", owner);
        script.setPublic(false);
        given(scriptRepository.findById(1L)).willReturn(Optional.of(script));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> scriptService.getScript(1L, other));
        assertEquals(403, ex.getStatusCode().value());
    }

    @Test
    void getScript_publicScript_nonOwner_succeeds() {
        User owner = buildUser(1L, "owner");
        User other = buildUser(2L, "other");
        Script script = buildScript(1L, "content", owner);
        script.setPublic(true);
        given(scriptRepository.findById(1L)).willReturn(Optional.of(script));

        assertDoesNotThrow(() -> scriptService.getScript(1L, other));
    }

    @Test
    void getScript_privateScript_owner_succeeds() {
        User owner = buildUser(1L, "owner");
        Script script = buildScript(1L, "content", owner);
        script.setPublic(false);
        given(scriptRepository.findById(1L)).willReturn(Optional.of(script));

        assertDoesNotThrow(() -> scriptService.getScript(1L, owner));
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private User buildUser(Long id, String username) {
        return User.builder()
                .id(id)
                .username(username)
                .email(username + "@test.com")
                .provider("local")
                .build();
    }

    private Script buildScript(Long id, String content, User owner) {
        Script s = new Script();
        s.setId(id);
        s.setContent(content);
        s.setOwner(owner);
        s.setName("TestScript");
        s.setPublic(true);
        s.setRequiredRobots(new HashSet<>());
        return s;
    }

    private Robot buildRobot(Long id) {
        Robot r = new Robot();
        r.setId(id);
        r.setTier(1);
        return r;
    }
}
