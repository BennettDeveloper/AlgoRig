package com.algorig.algorig_backend.service;

import com.algorig.algorig_backend.dto.PinScriptDto;
import com.algorig.algorig_backend.dto.ScriptDto;
import com.algorig.algorig_backend.dto.ScriptSaveRequestDto;
import com.algorig.algorig_backend.dto.ScriptValidationResultDto;
import com.algorig.algorig_backend.model.entity.Robot;
import com.algorig.algorig_backend.model.entity.Script;
import com.algorig.algorig_backend.model.entity.User;
import com.algorig.algorig_backend.model.entity.ScriptUpdateHistory;
import com.algorig.algorig_backend.repository.RobotRepository;
import com.algorig.algorig_backend.repository.ScriptRepository;
import com.algorig.algorig_backend.repository.ScriptUpdateHistoryRepository;
import com.algorig.algorig_backend.validation.ScriptValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ScriptService {

    private final ScriptRepository scriptRepository;
    private final ScriptValidator scriptValidator;
    private final ScriptUpdateHistoryRepository scriptUpdateHistoryRepository;
    private final RobotRepository robotRepository;
    private final ScriptStatsService scriptStatsService;

    @Transactional(readOnly = true)
    public List<ScriptDto> getUserScripts(User owner) {
        return scriptRepository.findByOwner(owner).stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<ScriptDto> getPublicScripts() {
        return scriptRepository.findByIsPublicTrue().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public ScriptDto getScript(Long id, User requestingUser) {
        Script script = scriptRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Script not found"));

        if (script.isPublic()) return toDto(script);
        if (isOwner(script, requestingUser)) return toDto(script);

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
    }

    public ScriptDto createScript(ScriptSaveRequestDto dto, User owner) {
        Script script = Script.builder()
                .name(dto.getName())
                .content(dto.getContent())
                .owner(owner)
                .isPublic(true)
                .requiredRobots(resolveRobots(dto.getRequiredRobotIds()))
                .build();
        Script saved = scriptRepository.save(script);
        scriptUpdateHistoryRepository.save(
                ScriptUpdateHistory.builder()
                        .script(saved)
                        .version(saved.getVersion())
                        .build());
        return toDto(saved);
    }

    public ScriptDto updateScript(Long id, ScriptSaveRequestDto dto, User requestingUser) {
        Script script = scriptRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Script not found"));
        if (!isOwner(script, requestingUser)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        // Detect changes before modifying
        boolean contentChanged = !Objects.equals(script.getContent(), dto.getContent());

        Set<Long> currentIds = script.getRequiredRobots()
                .stream()
                .map(Robot::getId)
                .collect(Collectors.toSet());
        Set<Long> newIds = dto.getRequiredRobotIds() != null
                ? new HashSet<>(dto.getRequiredRobotIds())
                : new HashSet<>();
        boolean requirementsChanged = !currentIds.equals(newIds);
        boolean statsResetNeeded = contentChanged || requirementsChanged;

        script.setName(dto.getName());
        script.setContent(dto.getContent());
        script.getRequiredRobots().clear();
        script.setRequiredRobots(resolveRobots(dto.getRequiredRobotIds()));

        Script saved = scriptRepository.save(script);
        scriptUpdateHistoryRepository.save(
                ScriptUpdateHistory.builder()
                        .script(saved)
                        .version(saved.getVersion())
                        .build());

        if (statsResetNeeded) {
            scriptStatsService.resetStats(saved, LocalDateTime.now());
        }

        return toDto(saved);
    }

    public void deleteScript(Long id, User requestingUser) {
        Script script = scriptRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Script not found"));
        if (!isOwner(script, requestingUser)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        scriptRepository.delete(script);
    }

    @Transactional(readOnly = true)
    public ScriptValidationResultDto validateScript(ScriptSaveRequestDto request) {
        return scriptValidator.validate(request.getContent());
    }

    public PinScriptDto pinScript(Long scriptId, int order, User user) {
        if (order < 1 || order > 3) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Featured order must be 1, 2, or 3");
        }
        Script script = scriptRepository.findById(scriptId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Script not found"));
        if (!isOwner(script, user)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        // Displace any script currently occupying this order slot
        scriptRepository.findByOwnerAndFeaturedOrderIsNotNullOrderByFeaturedOrderAsc(user)
                .stream()
                .filter(s -> s.getFeaturedOrder() == order && !s.getId().equals(scriptId))
                .findFirst()
                .ifPresent(s -> { s.setFeaturedOrder(null); scriptRepository.save(s); });

        script.setFeaturedOrder(order);
        Script saved = scriptRepository.save(script);
        return PinScriptDto.builder()
                .id(saved.getId())
                .name(saved.getName())
                .featuredOrder(saved.getFeaturedOrder())
                .build();
    }

    public void unpinScript(Long scriptId, User user) {
        Script script = scriptRepository.findById(scriptId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Script not found"));
        if (!isOwner(script, user)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        script.setFeaturedOrder(null);
        scriptRepository.save(script);
    }

    private Set<Robot> resolveRobots(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return new HashSet<>();
        return new HashSet<>(robotRepository.findAllById(ids));
    }

    private boolean isOwner(Script script, User user) {
        if (user == null || script.getOwner() == null) return false;
        return script.getOwner().getId().equals(user.getId());
    }

    private ScriptDto toDto(Script script) {
        User owner = script.getOwner();
        ScriptDto dto = ScriptDto.builder()
                .id(script.getId())
                .name(script.getName())
                .content(script.getContent())
                .version(script.getVersion())
                .createdAt(script.getCreatedAt())
                .updatedAt(script.getUpdatedAt())
                .ownerId(owner != null ? owner.getId() : null)
                .ownerUsername(owner != null ? owner.getUsername() : null)
                .isPublic(script.isPublic())
                .featuredOrder(script.getFeaturedOrder())
                .build();

        List<Long> requiredRobotIds = script.getRequiredRobots()
                .stream()
                .map(Robot::getId)
                .sorted()
                .collect(Collectors.toList());
        dto.setRequiredRobotIds(requiredRobotIds);
        dto.setHasRequirements(!requiredRobotIds.isEmpty());
        return dto;
    }
}
