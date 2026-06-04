package com.algorig.algorig_backend.service;

import com.algorig.algorig_backend.dto.*;
import com.algorig.algorig_backend.model.entity.Battle;
import com.algorig.algorig_backend.model.entity.Robot;
import com.algorig.algorig_backend.model.entity.Script;
import com.algorig.algorig_backend.repository.BattleRepository;
import com.algorig.algorig_backend.repository.RobotRepository;
import com.algorig.algorig_backend.repository.ScriptRepository;
import com.algorig.algorig_backend.repository.ScriptUpdateHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class RepositoryService {

    private final ScriptRepository scriptRepository;
    private final ScriptUpdateHistoryRepository scriptUpdateHistoryRepository;
    private final BattleRepository battleRepository;
    private final RobotRepository robotRepository;
    private final ScriptStatsService scriptStatsService;

    public Page<ScriptSummaryDto> getPublicScripts(
            String search,
            String authorUsername,
            String sort,
            int minBattles,
            boolean requirementsOnly,
            Pageable pageable) {

        String s = (search == null || search.isBlank()) ? "" : search.trim();
        String a = (authorUsername == null || authorUsername.isBlank()) ? "" : authorUsername.trim();

        Page<Script> page = switch (sort == null ? "" : sort) {
            case "winRate"  -> scriptRepository.findPublicScriptsSortByWinRateFiltered(s, a, minBattles, requirementsOnly, pageable);
            case "newest"   -> scriptRepository.findPublicScriptsSortByNewestFiltered(s, a, minBattles, requirementsOnly, pageable);
            default         -> scriptRepository.findPublicScriptsSortByMostUsedFiltered(s, a, minBattles, requirementsOnly, pageable);
        };

        return page.map(this::toSummaryDto);
    }

    public ScriptDetailDto getScriptDetail(Long scriptId) {
        Script script = scriptRepository.findById(scriptId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Script not found"));
        if (!script.isPublic()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Script is not public");
        }

        ScriptStatsDto stats = scriptStatsService.getStatsDtoForScript(script);

        List<ScriptUpdateHistoryDto> versionHistory = scriptUpdateHistoryRepository
                .findByScriptIdOrderBySavedAtDesc(scriptId)
                .stream()
                .map(h -> ScriptUpdateHistoryDto.builder()
                        .id(h.getId())
                        .version(h.getVersion())
                        .savedAt(h.getSavedAt())
                        .build())
                .toList();

        ScriptDetailDto dto = ScriptDetailDto.builder()
                .id(script.getId())
                .name(script.getName())
                .content(script.getContent())
                .version(script.getVersion())
                .createdAt(script.getCreatedAt())
                .updatedAt(script.getUpdatedAt())
                .ownerId(script.getOwner() != null ? script.getOwner().getId() : null)
                .ownerUsername(script.getOwner() != null ? script.getOwner().getUsername() : null)
                .ownerAvatarUrl(script.getOwner() != null ? script.getOwner().getAvatarUrl() : null)
                .isPublic(script.isPublic())
                .stats(stats)
                .versionHistory(versionHistory)
                .build();

        List<Long> requiredRobotIds = script.getRequiredRobots()
                .stream()
                .map(Robot::getId)
                .sorted()
                .collect(Collectors.toList());
        dto.setRequiredRobotIds(requiredRobotIds);
        dto.setHasRequirements(!requiredRobotIds.isEmpty());

        List<RobotDto> requiredRobotDtos = script.getRequiredRobots()
                .stream()
                .sorted(Comparator.comparing(Robot::getTier).thenComparing(Robot::getName))
                .map(this::toRobotDto)
                .collect(Collectors.toList());
        dto.setRequiredRobots(requiredRobotDtos);

        return dto;
    }

    public Page<BattleDto> getScriptBattles(Long scriptId, Pageable pageable) {
        Script script = scriptRepository.findById(scriptId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Script not found"));
        if (!script.isPublic()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Script is not public");
        }

        return battleRepository
                .findByScriptAOrScriptBOrderByFoughtAtDesc(script, script, pageable)
                .map(this::toBattleDto);
    }

    // ── Private helpers ────────────────────────────────────────────────────

    private ScriptSummaryDto toSummaryDto(Script script) {
        String preview = script.getContent();
        if (preview != null && preview.length() > 120) {
            int cutoff = preview.lastIndexOf('\n', 120);
            preview = preview.substring(0, cutoff > 0 ? cutoff : 120) + "...";
        }

        ScriptSummaryDto dto = ScriptSummaryDto.builder()
                .id(script.getId())
                .name(script.getName())
                .contentPreview(preview)
                .version(script.getVersion())
                .createdAt(script.getCreatedAt())
                .updatedAt(script.getUpdatedAt())
                .ownerId(script.getOwner() != null ? script.getOwner().getId() : null)
                .ownerUsername(script.getOwner() != null ? script.getOwner().getUsername() : null)
                .ownerAvatarUrl(script.getOwner() != null ? script.getOwner().getAvatarUrl() : null)
                .isPublic(script.isPublic())
                .stats(scriptStatsService.getStatsDtoForScript(script))
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

    private BattleDto toBattleDto(Battle battle) {
        RobotDto robotA = battle.getRobotAId() != null
                ? robotRepository.findById(battle.getRobotAId()).map(this::toRobotDto).orElse(null)
                : null;
        RobotDto robotB = battle.getRobotBId() != null
                ? robotRepository.findById(battle.getRobotBId()).map(this::toRobotDto).orElse(null)
                : null;

        return BattleDto.builder()
                .id(battle.getId())
                .battleCode(battle.getBattleCode())
                .robotAId(battle.getRobotAId())
                .robotBId(battle.getRobotBId())
                .scriptAId(battle.getScriptA() != null ? battle.getScriptA().getId() : null)
                .scriptBId(battle.getScriptB() != null ? battle.getScriptB().getId() : null)
                .winnerId(battle.getWinnerId())
                .totalTurns(battle.getTotalTurns())
                .battleLog(battle.getBattleLog())
                .foughtAt(battle.getFoughtAt())
                .robotA(robotA)
                .robotB(robotB)
                .ownerId(battle.getOwner() != null ? battle.getOwner().getId() : null)
                .ownerUsername(battle.getOwner() != null ? battle.getOwner().getUsername() : null)
                .ownerAvatarUrl(battle.getOwner() != null ? battle.getOwner().getAvatarUrl() : null)
                .isPublic(battle.isPublic())
                .build();
    }

    private RobotDto toRobotDto(Robot robot) {
        return RobotDto.builder()
                .id(robot.getId())
                .name(robot.getName())
                .tier(robot.getTier())
                .systemIntegrity(robot.getSystemIntegrity())
                .coreImpact(robot.getCoreImpact())
                .chassisArmor(robot.getChassisArmor())
                .clockSpeed(robot.getClockSpeed())
                .battery(robot.getBattery())
                .wattage(robot.getWattage())
                .cooling(robot.getCooling())
                .exploitPower(robot.getExploitPower())
                .firewallStrength(robot.getFirewallStrength())
                .memory(robot.getMemory())
                .stability(robot.getStability())
                .recovery(robot.getRecovery())
                .build();
    }
}
