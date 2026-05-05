package com.algorig.algorig_backend.service;

import com.algorig.algorig_backend.dto.BattleDto;
import com.algorig.algorig_backend.dto.BattleRequestDto;
import com.algorig.algorig_backend.engine.BattleEngine;
import com.algorig.algorig_backend.engine.BattleState;
import com.algorig.algorig_backend.model.entity.Battle;
import com.algorig.algorig_backend.model.entity.Robot;
import com.algorig.algorig_backend.model.entity.Script;
import com.algorig.algorig_backend.parser.ParsedScript;
import com.algorig.algorig_backend.parser.ScriptParser;
import com.algorig.algorig_backend.repository.BattleRepository;
import com.algorig.algorig_backend.repository.RobotRepository;
import com.algorig.algorig_backend.repository.ScriptRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BattleService {

    private final BattleRepository battleRepository;
    private final RobotRepository robotRepository;
    private final ScriptRepository scriptRepository;
    private final BattleEngine battleEngine;
    private final ScriptParser scriptParser;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public Optional<BattleDto> getBattleById(Long id) {
        return battleRepository.findById(id).map(this::toDto);
    }

    public BattleDto startBattle(BattleRequestDto request) {
        Robot robotA = robotRepository.findById(request.getRobotAId())
                .orElseThrow(() -> new RuntimeException("Robot A not found: " + request.getRobotAId()));
        Robot robotB = robotRepository.findById(request.getRobotBId())
                .orElseThrow(() -> new RuntimeException("Robot B not found: " + request.getRobotBId()));

        Script scriptA = scriptRepository.findById(request.getScriptAId())
                .orElseThrow(() -> new RuntimeException("Script A not found: " + request.getScriptAId()));
        Script scriptB = scriptRepository.findById(request.getScriptBId())
                .orElseThrow(() -> new RuntimeException("Script B not found: " + request.getScriptBId()));

        ParsedScript parsedA = scriptParser.parse(scriptA.getContent());
        ParsedScript parsedB = scriptParser.parse(scriptB.getContent());

        BattleState battleState = battleEngine.simulate(robotA, parsedA, robotB, parsedB);

        String battleLog;
        try {
            battleLog = objectMapper.writeValueAsString(battleState.getLog());
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize battle log", e);
        }

        Battle battle = Battle.builder()
                .robotAId(request.getRobotAId())
                .robotBId(request.getRobotBId())
                .scriptAId(request.getScriptAId())
                .scriptBId(request.getScriptBId())
                .winnerId(battleState.getWinnerId())
                .totalTurns(battleState.getCurrentTurn())
                .battleLog(battleLog)
                .build();

        return toDto(battleRepository.save(battle));
    }

    private BattleDto toDto(Battle battle) {
        return BattleDto.builder()
                .id(battle.getId())
                .robotAId(battle.getRobotAId())
                .robotBId(battle.getRobotBId())
                .scriptAId(battle.getScriptAId())
                .scriptBId(battle.getScriptBId())
                .winnerId(battle.getWinnerId())
                .totalTurns(battle.getTotalTurns())
                .battleLog(battle.getBattleLog())
                .foughtAt(battle.getFoughtAt())
                .build();
    }
}
