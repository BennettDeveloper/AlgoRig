package com.algorig.algorig_backend.service;

import com.algorig.algorig_backend.dto.BattleDto;
import com.algorig.algorig_backend.dto.BattleRequestDto;
import com.algorig.algorig_backend.dto.RobotDto;
import com.algorig.algorig_backend.dto.UserAchievementDto;
import com.algorig.algorig_backend.engine.BattleEngine;
import com.algorig.algorig_backend.engine.BattleState;
import com.algorig.algorig_backend.model.entity.Battle;
import com.algorig.algorig_backend.model.entity.CustomRobot;
import com.algorig.algorig_backend.model.entity.Robot;
import com.algorig.algorig_backend.model.entity.Script;
import com.algorig.algorig_backend.model.entity.User;
import com.algorig.algorig_backend.model.entity.UserAchievement;
import com.algorig.algorig_backend.parser.ParsedScript;
import com.algorig.algorig_backend.parser.ScriptParser;
import com.algorig.algorig_backend.repository.BattleRepository;
import com.algorig.algorig_backend.repository.CustomRobotRepository;
import com.algorig.algorig_backend.repository.RobotRepository;
import com.algorig.algorig_backend.repository.ScriptRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class BattleService {

    private final BattleRepository battleRepository;
    private final RobotRepository robotRepository;
    private final CustomRobotRepository customRobotRepository;
    private final ScriptRepository scriptRepository;
    private final BattleEngine battleEngine;
    private final ScriptParser scriptParser;
    private final UserStatsService userStatsService;
    private final AchievementService achievementService;
    private final ScriptStatsService scriptStatsService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String BATTLE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int BATTLE_CODE_GROUP_LENGTH = 5;
    private static final java.util.Random BATTLE_RANDOM = new java.util.Random();

    private String generateBattleCode() {
        StringBuilder sb = new StringBuilder("BATTLE-");
        for (int i = 0; i < BATTLE_CODE_GROUP_LENGTH; i++) {
            sb.append(BATTLE_ALPHABET.charAt(BATTLE_RANDOM.nextInt(BATTLE_ALPHABET.length())));
        }
        sb.append('-');
        for (int i = 0; i < BATTLE_CODE_GROUP_LENGTH; i++) {
            sb.append(BATTLE_ALPHABET.charAt(BATTLE_RANDOM.nextInt(BATTLE_ALPHABET.length())));
        }
        return sb.toString();
    }

    private String generateUniqueBattleCode() {
        String code;
        int attempts = 0;
        do {
            code = generateBattleCode();
            attempts++;
            if (attempts > 10) {
                throw new RuntimeException("Failed to generate unique battle code");
            }
        } while (battleRepository.findByBattleCode(code).isPresent());
        return code;
    }

    @Transactional(readOnly = true)
    public BattleDto getBattle(String battleCode, User requestingUser) {
        Battle battle = battleRepository.findByBattleCode(battleCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Battle not found"));

        if (battle.isPublic()) return toDto(battle);
        if (isOwner(battle, requestingUser)) return toDto(battle);

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
    }

    public BattleDto startBattle(BattleRequestDto request, User owner) {
        // ── Resolve Robot A (user slot) ───────────────────────────────────────
        Robot robotA;
        Long robotAIdForRecord;
        if ("CUSTOM".equals(request.getUserRobotType())) {
            Long customId = request.getUserCustomRobotId();
            if (customId == null)
                throw new IllegalArgumentException("userCustomRobotId is required when userRobotType is CUSTOM.");
            CustomRobot cr = customRobotRepository.findById(customId)
                    .orElseThrow(() -> new RuntimeException("Custom robot A not found: " + customId));
            if (cr.getTier().getValue() > request.getTierCap())
                throw new IllegalArgumentException(
                        "Custom robot '" + cr.getName() + "' is Tier " + cr.getTier().getValue()
                        + " but the tier cap is " + request.getTierCap() + ".");
            robotA = toRobotEntity(cr);
            robotAIdForRecord = customId;
        } else {
            robotA = robotRepository.findById(request.getRobotAId())
                    .orElseThrow(() -> new RuntimeException("Robot A not found: " + request.getRobotAId()));
            robotAIdForRecord = request.getRobotAId();
        }

        // ── Resolve Robot B (enemy slot) ──────────────────────────────────────
        Robot robotB;
        Long robotBIdForRecord;
        if ("CUSTOM".equals(request.getEnemyRobotType())) {
            Long customId = request.getEnemyCustomRobotId();
            if (customId == null)
                throw new IllegalArgumentException("enemyCustomRobotId is required when enemyRobotType is CUSTOM.");
            CustomRobot cr = customRobotRepository.findById(customId)
                    .orElseThrow(() -> new RuntimeException("Custom robot B not found: " + customId));
            if (cr.getTier().getValue() > request.getTierCap())
                throw new IllegalArgumentException(
                        "Custom robot '" + cr.getName() + "' is Tier " + cr.getTier().getValue()
                        + " but the tier cap is " + request.getTierCap() + ".");
            robotB = toRobotEntity(cr);
            robotBIdForRecord = customId;
        } else {
            robotB = robotRepository.findById(request.getRobotBId())
                    .orElseThrow(() -> new RuntimeException("Robot B not found: " + request.getRobotBId()));
            robotBIdForRecord = request.getRobotBId();
        }

        Script scriptA = scriptRepository.findById(request.getScriptAId())
                .orElseThrow(() -> new RuntimeException("Script A not found: " + request.getScriptAId()));
        Script scriptB = scriptRepository.findById(request.getScriptBId())
                .orElseThrow(() -> new RuntimeException("Script B not found: " + request.getScriptBId()));

        System.out.println("Parsing Script A (id=" + scriptA.getId() + "): " + scriptA.getContent());
        System.out.println("Parsing Script B (id=" + scriptB.getId() + "): " + scriptB.getContent());

        ParsedScript parsedA = scriptParser.parse(scriptA.getContent());
        ParsedScript parsedB = scriptParser.parse(scriptB.getContent());

        int maxTurns = request.getMaxTurns() > 0 ? request.getMaxTurns() : BattleEngine.DEFAULT_MAX_TURNS;
        BattleState battleState = battleEngine.simulate(robotA, parsedA, robotB, parsedB, maxTurns);

        String battleLog;
        try {
            battleLog = objectMapper.writeValueAsString(battleState.getLog());
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize battle log", e);
        }

        String battleCode = generateUniqueBattleCode();

        Battle battle = Battle.builder()
                .battleCode(battleCode)
                .robotAId(robotAIdForRecord)
                .robotBId(robotBIdForRecord)
                .robotAType("CUSTOM".equals(request.getUserRobotType()) ? "CUSTOM" : "PRESET")
                .robotBType("CUSTOM".equals(request.getEnemyRobotType()) ? "CUSTOM" : "PRESET")
                .scriptA(scriptA)
                .scriptB(scriptB)
                .owner(owner)
                .winnerId(battleState.getWinnerId())
                .totalTurns(battleState.getCurrentTurn())
                .battleLog(battleLog)
                .build();

        Battle saved = battleRepository.save(battle);

        // Script stats update runs regardless of whether battle has an owner
        scriptStatsService.updateAfterBattle(saved);

        List<UserAchievementDto> newAchievementDtos = List.of();
        if (saved.getOwner() != null) {
            userStatsService.updateAfterBattle(saved);
            List<UserAchievement> newAchievements = achievementService.checkAndAward(saved);
            newAchievementDtos = achievementService.toDto(newAchievements);
        }

        BattleDto dto = toDto(saved);
        dto.setNewAchievements(newAchievementDtos);
        return dto;
    }

    @Transactional(readOnly = true)
    public List<BattleDto> getUserBattles(User owner) {
        return battleRepository.findByOwnerOrderByFoughtAtDesc(owner)
                .stream().map(this::toDto).toList();
    }

    private boolean isOwner(Battle battle, User user) {
        if (user == null || battle.getOwner() == null) return false;
        return battle.getOwner().getId().equals(user.getId());
    }

    private RobotDto resolveRobotDto(Long robotId, String robotType) {
        if ("CUSTOM".equals(robotType)) {
            return customRobotRepository.findById(robotId)
                    .map(cr -> toRobotDto(toRobotEntity(cr)))
                    .orElse(null);
        }
        return robotRepository.findById(robotId).map(this::toRobotDto).orElse(null);
    }

    private BattleDto toDto(Battle battle) {
        RobotDto robotA = resolveRobotDto(battle.getRobotAId(), battle.getRobotAType());
        RobotDto robotB = resolveRobotDto(battle.getRobotBId(), battle.getRobotBType());
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

    private Robot toRobotEntity(CustomRobot cr) {
        return Robot.builder()
                .id(cr.getId())
                .name(cr.getName())
                .tier(cr.getTier().getValue())
                .systemIntegrity(cr.getHp())
                .coreImpact(cr.getCoreImpact())
                .exploitPower(cr.getExploitPower())
                .clockSpeed(cr.getClockSpeed())
                .chassisArmor(cr.getChassisArmor())
                .firewallStrength(cr.getFirewallStrength())
                .battery(cr.getBattery())
                .passiveAbility(cr.getPassiveAbility().name())
                .stability(100)
                .wattage(0)
                .cooling(0)
                .memory(0)
                .recovery(0)
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
