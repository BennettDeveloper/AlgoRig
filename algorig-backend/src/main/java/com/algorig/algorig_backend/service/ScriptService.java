package com.algorig.algorig_backend.service;

import com.algorig.algorig_backend.dto.PinScriptDto;
import com.algorig.algorig_backend.dto.ScriptDto;
import com.algorig.algorig_backend.dto.ScriptSaveRequestDto;
import com.algorig.algorig_backend.dto.ScriptValidationResultDto;
import com.algorig.algorig_backend.model.entity.Script;
import com.algorig.algorig_backend.model.entity.User;
import com.algorig.algorig_backend.model.entity.ScriptUpdateHistory;
import com.algorig.algorig_backend.repository.ScriptRepository;
import com.algorig.algorig_backend.repository.ScriptUpdateHistoryRepository;
import com.algorig.algorig_backend.validation.ScriptValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ScriptService {

    private final ScriptRepository scriptRepository;
    private final ScriptValidator scriptValidator;
    private final ScriptUpdateHistoryRepository scriptUpdateHistoryRepository;
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
                .requiredTiers(serializeTiers(dto.getRequiredTiers()))
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

        boolean contentChanged = !Objects.equals(script.getContent(), dto.getContent());
        String newTiersStr = serializeTiers(dto.getRequiredTiers());
        boolean requirementsChanged = !Objects.equals(script.getRequiredTiers(), newTiersStr);
        boolean statsResetNeeded = contentChanged || requirementsChanged;

        script.setName(dto.getName());
        script.setContent(dto.getContent());
        script.setRequiredTiers(newTiersStr);

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

    public ScriptDto updateRequiredTiers(Long id, List<String> tiers, User requestingUser) {
        Script script = scriptRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Script not found"));
        if (!isOwner(script, requestingUser)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        String newTiersStr = serializeTiers(tiers);
        boolean requirementsChanged = !Objects.equals(script.getRequiredTiers(), newTiersStr);
        script.setRequiredTiers(newTiersStr);
        Script saved = scriptRepository.save(script);

        if (requirementsChanged) {
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

    private String serializeTiers(List<String> tiers) {
        if (tiers == null || tiers.isEmpty()) return null;
        return tiers.stream().sorted().collect(Collectors.joining(","));
    }

    private boolean isOwner(Script script, User user) {
        if (user == null || script.getOwner() == null) return false;
        return script.getOwner().getId().equals(user.getId());
    }

    private ScriptDto toDto(Script script) {
        User owner = script.getOwner();
        return ScriptDto.builder()
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
                .requiredTiers(script.getRequiredTiersList())
                .build();
    }
}
