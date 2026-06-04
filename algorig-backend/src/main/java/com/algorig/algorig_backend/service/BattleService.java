package com.algorig.algorig_backend.service;

import com.algorig.algorig_backend.dto.BattleDto;
import com.algorig.algorig_backend.dto.BattleRequestDto;
import com.algorig.algorig_backend.dto.RobotDto;
import com.algorig.algorig_backend.dto.UserAchievementDto;
import com.algorig.algorig_backend.engine.BattleEngine;
import com.algorig.algorig_backend.engine.BattleState;
import com.algorig.algorig_backend.model.entity.Battle;
import com.algorig.algorig_backend.model.entity.Robot;
import com.algorig.algorig_backend.model.entity.Script;
import com.algorig.algorig_backend.model.entity.User;
import com.algorig.algorig_backend.model.entity.UserAchievement;
import com.algorig.algorig_backend.parser.ParsedScript;
import com.algorig.algorig_backend.parser.ScriptParser;
import com.algorig.algorig_backend.repository.BattleRepository;
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
    private final ScriptRepository scriptRepository;
    private final BattleEngine battleEngine;
    private final ScriptParser scriptParser;
    private final UserStatsService userStatsService;
    private final AchievementService achievementService;
    private final ScriptStatsService scriptStatsService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional(readOnly = true)
    public BattleDto getBattle(Long id, User requestingUser) {
        Battle battle = battleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Battle not found"));

        if (battle.isPublic()) return toDto(battle);
        if (isOwner(battle, requestingUser)) return toDto(battle);

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
    }

    public BattleDto startBattle(BattleRequestDto request, User owner) {
        Robot robotA = robotRepository.findById(request.getRobotAId())
                .orElseThrow(() -> new RuntimeException("Robot A not found: " + request.getRobotAId()));
        Robot robotB = robotRepository.findById(request.getRobotBId())
                .orElseThrow(() -> new RuntimeException("Robot B not found: " + request.getRobotBId()));

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

        Battle battle = Battle.builder()
                .robotAId(request.getRobotAId())
                .robotBId(request.getRobotBId())
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

    private BattleDto toDto(Battle battle) {
        RobotDto robotA = robotRepository.findById(battle.getRobotAId()).map(this::toRobotDto).orElse(null);
        RobotDto robotB = robotRepository.findById(battle.getRobotBId()).map(this::toRobotDto).orElse(null);
        return BattleDto.builder()
                .id(battle.getId())
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
