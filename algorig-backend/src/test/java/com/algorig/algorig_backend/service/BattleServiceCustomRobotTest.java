package com.algorig.algorig_backend.service;

import com.algorig.algorig_backend.dto.BattleDto;
import com.algorig.algorig_backend.dto.BattleRequestDto;
import com.algorig.algorig_backend.engine.BattleEngine;
import com.algorig.algorig_backend.engine.BattleState;
import com.algorig.algorig_backend.engine.RobotPassive;
import com.algorig.algorig_backend.model.entity.Battle;
import com.algorig.algorig_backend.model.entity.CustomRobot;
import com.algorig.algorig_backend.model.entity.Robot;
import com.algorig.algorig_backend.model.entity.Script;
import com.algorig.algorig_backend.model.entity.User;
import com.algorig.algorig_backend.model.enums.RobotTier;
import com.algorig.algorig_backend.parser.ScriptParser;
import com.algorig.algorig_backend.repository.BattleRepository;
import com.algorig.algorig_backend.repository.CustomRobotRepository;
import com.algorig.algorig_backend.repository.RobotRepository;
import com.algorig.algorig_backend.repository.ScriptRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BattleServiceCustomRobotTest {

    @Mock BattleRepository       battleRepository;
    @Mock RobotRepository        robotRepository;
    @Mock CustomRobotRepository  customRobotRepository;
    @Mock ScriptRepository       scriptRepository;
    @Mock BattleEngine           battleEngine;
    @Mock ScriptParser           scriptParser;
    @Mock UserStatsService       userStatsService;
    @Mock AchievementService     achievementService;
    @Mock ScriptStatsService     scriptStatsService;

    @InjectMocks BattleService battleService;

    // =========================================================================
    // Group 1 — resolveRobotDto routing (core bug fix tests)
    // =========================================================================

    @Test
    void resolveRobotDto_withPresetType_loadsFromRobotRepository() {
        Robot preset = buildPresetRobot(5L, "Sparky", 70);
        Battle battle = battleForToDto(5L, "PRESET", 99L, "PRESET");
        given(battleRepository.findByOwnerOrderByFoughtAtDesc(any())).willReturn(List.of(battle));
        given(robotRepository.findById(5L)).willReturn(Optional.of(preset));
        given(robotRepository.findById(99L)).willReturn(Optional.empty());

        List<BattleDto> dtos = battleService.getUserBattles(buildUser(1L));

        assertEquals(70, dtos.get(0).getRobotA().getSystemIntegrity());
        verify(robotRepository).findById(5L);
        verify(customRobotRepository, never()).findById(5L);
    }

    @Test
    void resolveRobotDto_withCustomType_loadsFromCustomRobotRepository() {
        CustomRobot custom  = buildCustomRobot(5L, "WorldwideCoder", 189, RobotTier.TIER_3);
        Battle battle = battleForToDto(5L, "CUSTOM", 99L, "PRESET");
        given(battleRepository.findByOwnerOrderByFoughtAtDesc(any())).willReturn(List.of(battle));
        given(customRobotRepository.findById(5L)).willReturn(Optional.of(custom));
        given(robotRepository.findById(99L)).willReturn(Optional.empty());

        List<BattleDto> dtos = battleService.getUserBattles(buildUser(1L));

        assertEquals(189, dtos.get(0).getRobotA().getSystemIntegrity());
        verify(customRobotRepository).findById(5L);
        // preset repo must not be consulted for a CUSTOM slot
        verify(robotRepository, never()).findById(5L);
    }

    @Test
    void resolveRobotDto_idCollision_customTakesPrecedenceOverPreset() {
        // This is the exact production bug: custom robot ID = 3 collides with preset robot ID = 3.
        // Before the fix, toDto always queried robotRepository and returned the preset's stats.
        CustomRobot custom = buildCustomRobot(3L, "WorldwideCoder", 189, RobotTier.TIER_3);
        Robot preset        = buildPresetRobot(3L, "Sparky", 70);
        Battle battle = battleForToDto(3L, "CUSTOM", 3L, "PRESET");
        given(battleRepository.findByOwnerOrderByFoughtAtDesc(any())).willReturn(List.of(battle));
        given(customRobotRepository.findById(3L)).willReturn(Optional.of(custom));
        given(robotRepository.findById(3L)).willReturn(Optional.of(preset));

        List<BattleDto> dtos = battleService.getUserBattles(buildUser(1L));

        assertEquals(189, dtos.get(0).getRobotA().getSystemIntegrity(),
                "Slot A (CUSTOM) must use custom robot's HP=189, not preset's HP=70");
        assertEquals("WorldwideCoder", dtos.get(0).getRobotA().getName());
        assertEquals(70, dtos.get(0).getRobotB().getSystemIntegrity(),
                "Slot B (PRESET) must still use the preset robot's HP=70");
        assertEquals("Sparky", dtos.get(0).getRobotB().getName());
    }

    @Test
    void resolveRobotDto_defaultType_treatedAsPreset() {
        // Battles created before the migration have null robot type columns.
        // null type must silently fall back to preset lookup — no NPE, no exception.
        Robot preset = buildPresetRobot(7L, "RustBucket", 80);
        Battle oldBattle = Battle.builder()
                .battleCode("BATTLE-OLD00-OLD00")
                .robotAId(7L).robotAType(null)
                .robotBId(8L).robotBType(null)
                .winnerId("A").totalTurns(3).battleLog("[]")
                .build();
        given(battleRepository.findByOwnerOrderByFoughtAtDesc(any())).willReturn(List.of(oldBattle));
        given(robotRepository.findById(7L)).willReturn(Optional.of(preset));
        given(robotRepository.findById(8L)).willReturn(Optional.empty());

        assertDoesNotThrow(() -> battleService.getUserBattles(buildUser(1L)));

        verify(robotRepository).findById(7L);
        verify(customRobotRepository, never()).findById(any());
    }

    @Test
    void resolveRobotDto_customRobotNotFound_returnsNullForThatSlot() {
        // Custom robot deleted after battle was recorded: toDto must return null, not throw.
        Battle battle = battleForToDto(99L, "CUSTOM", 1L, "PRESET");
        given(battleRepository.findByOwnerOrderByFoughtAtDesc(any())).willReturn(List.of(battle));
        given(customRobotRepository.findById(99L)).willReturn(Optional.empty());
        given(robotRepository.findById(1L)).willReturn(Optional.empty());

        List<BattleDto> dtos = battleService.getUserBattles(buildUser(1L));

        assertNull(dtos.get(0).getRobotA(),
                "A deleted custom robot must produce null robotA in the DTO, not an exception");
    }

    // =========================================================================
    // Group 2 — startBattle type recording
    // =========================================================================

    @Test
    void startBattle_presetVsPreset_recordsBothAsPresetType() {
        Robot a = buildPresetRobot(1L, "BoltJr", 60);
        Robot b = buildPresetRobot(2L, "Sparky", 70);
        stubStartBattle(Optional.of(a), Optional.empty(), Optional.of(b), Optional.empty());

        BattleRequestDto request = BattleRequestDto.builder()
                .userRobotType("PRESET").robotAId(1L)
                .enemyRobotType("PRESET").robotBId(2L)
                .scriptAId(10L).scriptBId(11L).build();
        battleService.startBattle(request, null);

        Battle saved = captureLastSavedBattle();
        assertEquals("PRESET", saved.getRobotAType());
        assertEquals("PRESET", saved.getRobotBType());
        assertEquals(1L, saved.getRobotAId());
        assertEquals(2L, saved.getRobotBId());
    }

    @Test
    void startBattle_customVsPreset_recordsTypesCorrectly() {
        CustomRobot custom = buildCustomRobot(7L, "TurboBot", 140, RobotTier.TIER_2);
        Robot preset        = buildPresetRobot(3L, "Sparky", 70);
        stubStartBattle(Optional.empty(), Optional.of(custom), Optional.of(preset), Optional.empty());

        BattleRequestDto request = BattleRequestDto.builder()
                .userRobotType("CUSTOM").userCustomRobotId(7L)
                .enemyRobotType("PRESET").robotBId(3L)
                .scriptAId(10L).scriptBId(11L).build();
        battleService.startBattle(request, null);

        Battle saved = captureLastSavedBattle();
        assertEquals("CUSTOM", saved.getRobotAType());
        assertEquals("PRESET", saved.getRobotBType());
        assertEquals(7L, saved.getRobotAId());
        assertEquals(3L, saved.getRobotBId());
    }

    @Test
    void startBattle_customVsCustom_recordsBothAsCustomType() {
        CustomRobot customA = buildCustomRobot(7L, "TurboBot", 140, RobotTier.TIER_2);
        CustomRobot customB = buildCustomRobot(8L, "SteelCore", 160, RobotTier.TIER_2);
        stubStartBattle(Optional.empty(), Optional.of(customA), Optional.empty(), Optional.of(customB));

        BattleRequestDto request = BattleRequestDto.builder()
                .userRobotType("CUSTOM").userCustomRobotId(7L)
                .enemyRobotType("CUSTOM").enemyCustomRobotId(8L)
                .scriptAId(10L).scriptBId(11L).build();
        battleService.startBattle(request, null);

        Battle saved = captureLastSavedBattle();
        assertEquals("CUSTOM", saved.getRobotAType());
        assertEquals("CUSTOM", saved.getRobotBType());
        assertEquals(7L, saved.getRobotAId());
        assertEquals(8L, saved.getRobotBId());
    }

    /*
    @Test
    void startBattle_customRobotTierCapEnforced() {
        CustomRobot tier3 = buildCustomRobot(7L, "TierThree", 200, RobotTier.TIER_3);
        given(customRobotRepository.findById(7L)).willReturn(Optional.of(tier3));

        BattleRequestDto request = BattleRequestDto.builder()
                .userRobotType("CUSTOM").userCustomRobotId(7L)
                .enemyRobotType("PRESET").robotBId(2L)
                .scriptAId(10L).scriptBId(11L)
                .tierCap(2).build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> battleService.startBattle(request, null));
        assertTrue(ex.getMessage().contains("Tier 3"), "Error must name the robot's tier");
        assertTrue(ex.getMessage().contains("tier cap is 2"), "Error must state the tier cap");
        verify(battleRepository, never()).save(any());
    }
    */

    @Test
    void startBattle_customRobotNotFound_throwsRuntimeException() {
        given(customRobotRepository.findById(99L)).willReturn(Optional.empty());

        BattleRequestDto request = BattleRequestDto.builder()
                .userRobotType("CUSTOM").userCustomRobotId(99L)
                .enemyRobotType("PRESET").robotBId(2L)
                .scriptAId(10L).scriptBId(11L).build();

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> battleService.startBattle(request, null));
        assertTrue(ex.getMessage().contains("99"), "Error must include the missing robot ID");
        verify(battleRepository, never()).save(any());
    }

    // =========================================================================
    // Group 3 — toDto stat correctness
    // =========================================================================

    @Test
    void toDto_customRobot_allStatsCorrectlyMapped() {
        CustomRobot custom = CustomRobot.builder()
                .id(11L).name("TestBot").tier(RobotTier.TIER_3).hp(140)
                .coreImpact(45).exploitPower(50).clockSpeed(55)
                .chassisArmor(40).firewallStrength(45).battery(80)
                .passiveAbility(RobotPassive.PHASE_SHIFT).build();
        Battle battle = battleForToDto(11L, "CUSTOM", 99L, "PRESET");
        given(battleRepository.findByOwnerOrderByFoughtAtDesc(any())).willReturn(List.of(battle));
        given(customRobotRepository.findById(11L)).willReturn(Optional.of(custom));
        given(robotRepository.findById(99L)).willReturn(Optional.empty());

        var robotA = battleService.getUserBattles(buildUser(1L)).get(0).getRobotA();

        assertAll("All custom robot stats must survive toRobotEntity → toRobotDto conversion",
                () -> assertEquals("TestBot", robotA.getName()),
                () -> assertEquals(3,         robotA.getTier()),
                () -> assertEquals(140,       robotA.getSystemIntegrity()),
                () -> assertEquals(45,        robotA.getCoreImpact()),
                () -> assertEquals(50,        robotA.getExploitPower()),
                () -> assertEquals(55,        robotA.getClockSpeed()),
                () -> assertEquals(40,        robotA.getChassisArmor()),
                () -> assertEquals(45,        robotA.getFirewallStrength()),
                () -> assertEquals(80,        robotA.getBattery())
        );
    }

    @Test
    void toDto_presetRobot_allStatsCorrectlyMapped() {
        Robot preset = Robot.builder()
                .id(3L).name("Sparky").tier(1).systemIntegrity(70)
                .coreImpact(18).exploitPower(15).clockSpeed(20)
                .chassisArmor(22).firewallStrength(18).battery(55)
                .wattage(5).cooling(3).memory(2).stability(100).recovery(4)
                .passiveAbility("RESILIENT_FRAME").build();
        Battle battle = battleForToDto(3L, "PRESET", 99L, "PRESET");
        given(battleRepository.findByOwnerOrderByFoughtAtDesc(any())).willReturn(List.of(battle));
        given(robotRepository.findById(3L)).willReturn(Optional.of(preset));
        given(robotRepository.findById(99L)).willReturn(Optional.empty());

        var robotA = battleService.getUserBattles(buildUser(1L)).get(0).getRobotA();

        assertAll("All preset robot stats must map correctly (no regression on original path)",
                () -> assertEquals("Sparky", robotA.getName()),
                () -> assertEquals(1,        robotA.getTier()),
                () -> assertEquals(70,       robotA.getSystemIntegrity()),
                () -> assertEquals(18,       robotA.getCoreImpact()),
                () -> assertEquals(15,       robotA.getExploitPower()),
                () -> assertEquals(20,       robotA.getClockSpeed()),
                () -> assertEquals(22,       robotA.getChassisArmor()),
                () -> assertEquals(18,       robotA.getFirewallStrength()),
                () -> assertEquals(55,       robotA.getBattery()),
                () -> assertEquals(5,        robotA.getWattage()),
                () -> assertEquals(3,        robotA.getCooling()),
                () -> assertEquals(4,        robotA.getRecovery())
        );
    }

    @Test
    void toDto_customRobot_fixedStatsApplied() {
        // toRobotEntity hard-codes stability=100 and zeros wattage/cooling/memory/recovery
        // for custom robots because those fields are not user-configurable.
        CustomRobot custom = buildCustomRobot(5L, "GhostCPU", 160, RobotTier.TIER_3);
        Battle battle = battleForToDto(5L, "CUSTOM", 99L, "PRESET");
        given(battleRepository.findByOwnerOrderByFoughtAtDesc(any())).willReturn(List.of(battle));
        given(customRobotRepository.findById(5L)).willReturn(Optional.of(custom));
        given(robotRepository.findById(99L)).willReturn(Optional.empty());

        var robotA = battleService.getUserBattles(buildUser(1L)).get(0).getRobotA();

        assertAll("Non-configurable stats must be fixed regardless of custom robot input",
                () -> assertEquals(100, robotA.getStability(), "stability must be 100"),
                () -> assertEquals(0,   robotA.getWattage(),   "wattage must be 0"),
                () -> assertEquals(0,   robotA.getCooling(),   "cooling must be 0"),
                () -> assertEquals(0,   robotA.getMemory(),    "memory must be 0"),
                () -> assertEquals(0,   robotA.getRecovery(),  "recovery must be 0")
        );
    }

    // =========================================================================
    // Group 4 — Battle type field defaults
    // =========================================================================

    @Test
    void battle_robotAType_defaultsToPreset() {
        Battle battle = Battle.builder().build();
        assertEquals("PRESET", battle.getRobotAType(),
                "@Builder.Default must initialise robotAType to 'PRESET'");
    }

    @Test
    void battle_robotBType_defaultsToPreset() {
        Battle battle = Battle.builder().build();
        assertEquals("PRESET", battle.getRobotBType(),
                "@Builder.Default must initialise robotBType to 'PRESET'");
    }

    @Test
    void battle_robotTypeFields_persistAndLoad() {
        // Verifies that startBattle writes non-null type values to the Battle before save,
        // so a subsequent toDto call reads the correct type from the persisted entity.
        CustomRobot customA = buildCustomRobot(7L, "TurboBot", 140, RobotTier.TIER_2);
        Robot presetB        = buildPresetRobot(3L, "Sparky", 70);
        stubStartBattle(Optional.empty(), Optional.of(customA), Optional.of(presetB), Optional.empty());

        BattleRequestDto request = BattleRequestDto.builder()
                .userRobotType("CUSTOM").userCustomRobotId(7L)
                .enemyRobotType("PRESET").robotBId(3L)
                .scriptAId(10L).scriptBId(11L).build();
        battleService.startBattle(request, null);

        Battle saved = captureLastSavedBattle();
        assertNotNull(saved.getRobotAType(), "robotAType must not be null after startBattle");
        assertNotNull(saved.getRobotBType(), "robotBType must not be null after startBattle");
        assertEquals("CUSTOM", saved.getRobotAType());
        assertEquals("PRESET", saved.getRobotBType());
    }

    // =========================================================================
    // Group 5 — Edge cases and regression
    // =========================================================================

    @Test
    void toDto_bothRobotsCustom_correctStatsForEachSide() {
        // Two distinct custom robots; verify stats are not swapped between slots.
        CustomRobot highAtk = CustomRobot.builder()
                .id(10L).name("AtkBot").tier(RobotTier.TIER_2).hp(120)
                .coreImpact(80).exploitPower(20).clockSpeed(20)
                .chassisArmor(15).firewallStrength(20).battery(50)
                .passiveAbility(RobotPassive.SELF_REPAIR).build();
        CustomRobot highDef = CustomRobot.builder()
                .id(11L).name("DefBot").tier(RobotTier.TIER_2).hp(200)
                .coreImpact(15).exploitPower(20).clockSpeed(20)
                .chassisArmor(80).firewallStrength(20).battery(50)
                .passiveAbility(RobotPassive.SELF_REPAIR).build();
        Battle battle = battleForToDto(10L, "CUSTOM", 11L, "CUSTOM");
        given(battleRepository.findByOwnerOrderByFoughtAtDesc(any())).willReturn(List.of(battle));
        given(customRobotRepository.findById(10L)).willReturn(Optional.of(highAtk));
        given(customRobotRepository.findById(11L)).willReturn(Optional.of(highDef));

        List<BattleDto> dtos = battleService.getUserBattles(buildUser(1L));

        assertEquals(120, dtos.get(0).getRobotA().getSystemIntegrity(), "Slot A must get AtkBot's HP");
        assertEquals(80,  dtos.get(0).getRobotA().getCoreImpact(),       "Slot A must get AtkBot's high attack");
        assertEquals(200, dtos.get(0).getRobotB().getSystemIntegrity(), "Slot B must get DefBot's HP");
        assertEquals(80,  dtos.get(0).getRobotB().getChassisArmor(),    "Slot B must get DefBot's high defense");
    }

    @Test
    void toDto_mixedBattle_winnerSideGetsCustomRobotName() {
        // Reproduces the battle BATTLE-YNLX8-ATRM9 scenario:
        // custom robot won as side A; the DTO must use the custom robot's name, not the preset's.
        CustomRobot custom = buildCustomRobot(7L, "WorldwideCoder", 189, RobotTier.TIER_3);
        Robot preset        = buildPresetRobot(3L, "Sparky", 70);
        Battle battle = Battle.builder()
                .battleCode("BATTLE-YNLX8-ATRM9")
                .robotAId(7L).robotAType("CUSTOM")
                .robotBId(3L).robotBType("PRESET")
                .winnerId("A").totalTurns(10).battleLog("[]")
                .build();
        given(battleRepository.findByOwnerOrderByFoughtAtDesc(any())).willReturn(List.of(battle));
        given(customRobotRepository.findById(7L)).willReturn(Optional.of(custom));
        given(robotRepository.findById(3L)).willReturn(Optional.of(preset));

        BattleDto dto = battleService.getUserBattles(buildUser(1L)).get(0);

        assertEquals("A", dto.getWinnerId(),
                "winnerId must be the slot label, not a robot name");
        assertEquals("WorldwideCoder", dto.getRobotA().getName(),
                "Winning slot A must carry the custom robot's name");
        assertEquals("Sparky", dto.getRobotB().getName(),
                "Losing slot B must carry the preset robot's name");
    }

    @Test
    void startBattle_customRobotStats_correctlyPassedToEngine() {
        // After resolving a custom robot, its stats must be handed to BattleEngine verbatim.
        // Specifically, systemIntegrity = custom robot's hp (not a preset robot's hp).
        CustomRobot custom = CustomRobot.builder()
                .id(7L).name("SpeedBot").tier(RobotTier.TIER_3).hp(189)
                .coreImpact(55).exploitPower(60).clockSpeed(65)
                .chassisArmor(20).firewallStrength(20).battery(90)
                .passiveAbility(RobotPassive.SELF_REPAIR).build();
        Robot presetB = buildPresetRobot(3L, "Sparky", 70);
        stubStartBattle(Optional.empty(), Optional.of(custom), Optional.of(presetB), Optional.empty());

        BattleRequestDto request = BattleRequestDto.builder()
                .userRobotType("CUSTOM").userCustomRobotId(7L)
                .enemyRobotType("PRESET").robotBId(3L)
                .scriptAId(10L).scriptBId(11L).build();
        battleService.startBattle(request, null);

        ArgumentCaptor<Robot> robotACaptor = ArgumentCaptor.forClass(Robot.class);
        verify(battleEngine).simulate(robotACaptor.capture(), any(), any(), any(), anyInt());
        Robot engineRobotA = robotACaptor.getValue();
        assertAll("Custom robot stats must reach BattleEngine without alteration",
                () -> assertEquals(189, engineRobotA.getSystemIntegrity()),
                () -> assertEquals(55,  engineRobotA.getCoreImpact()),
                () -> assertEquals(60,  engineRobotA.getExploitPower()),
                () -> assertEquals(65,  engineRobotA.getClockSpeed()),
                () -> assertEquals(90,  engineRobotA.getBattery())
        );
    }

    @Test
    void regression_oldBattleWithNullType_doesNotCrash() {
        // Pre-migration rows have null robot_a_type / robot_b_type.
        // resolveRobotDto(id, null) must treat null as "PRESET" and not throw NullPointerException.
        Robot preset = buildPresetRobot(5L, "BoltJr", 60);
        Battle oldBattle = Battle.builder()
                .battleCode("BATTLE-PRFIX-PRFIX")
                .robotAId(5L).robotAType(null)
                .robotBId(6L).robotBType(null)
                .winnerId("B").totalTurns(7).battleLog("[]")
                .build();
        given(battleRepository.findByOwnerOrderByFoughtAtDesc(any())).willReturn(List.of(oldBattle));
        given(robotRepository.findById(5L)).willReturn(Optional.of(preset));
        given(robotRepository.findById(6L)).willReturn(Optional.empty());

        List<BattleDto> dtos = assertDoesNotThrow(
                () -> battleService.getUserBattles(buildUser(1L)),
                "Null robot type in a pre-migration battle must not throw NullPointerException");

        assertNotNull(dtos);
        assertEquals(60,  dtos.get(0).getRobotA().getSystemIntegrity(),
                "Pre-migration preset robot A must still resolve correctly");
        assertNull(dtos.get(0).getRobotB(),
                "Missing robot B must produce null gracefully");
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private User buildUser(Long id) {
        return User.builder()
                .id(id)
                .username("user" + id)
                .email("user" + id + "@test.com")
                .provider("google")
                .build();
    }

    private CustomRobot buildCustomRobot(Long id, String name, int hp, RobotTier tier) {
        return CustomRobot.builder()
                .id(id).name(name).hp(hp).tier(tier)
                .coreImpact(20).exploitPower(20).clockSpeed(20)
                .chassisArmor(20).firewallStrength(20).battery(50)
                .passiveAbility(RobotPassive.SELF_REPAIR)
                .build();
    }

    private Robot buildPresetRobot(Long id, String name, int hp) {
        return Robot.builder()
                .id(id).name(name).tier(1).systemIntegrity(hp)
                .coreImpact(15).exploitPower(15).clockSpeed(15)
                .chassisArmor(15).firewallStrength(15).battery(50)
                .wattage(0).cooling(0).memory(0).stability(100).recovery(0)
                .passiveAbility("RESILIENT_FRAME")
                .build();
    }

    private Battle battleForToDto(Long robotAId, String robotAType, Long robotBId, String robotBType) {
        return Battle.builder()
                .battleCode("BATTLE-TEST0-TEST0")
                .robotAId(robotAId).robotAType(robotAType)
                .robotBId(robotBId).robotBType(robotBType)
                .scriptA(Script.builder().id(1L).build())
                .scriptB(Script.builder().id(2L).build())
                .winnerId("A").totalTurns(5).battleLog("[]")
                .build();
    }

    /**
     * Stubs the minimal set of mocks required for startBattle to complete.
     *
     * Pass Optional.of(Robot) for a PRESET slot, Optional.empty() for CUSTOM or unused.
     * Pass Optional.of(CustomRobot) for a CUSTOM slot, Optional.empty() for PRESET or unused.
     * Scripts 10 and 11 are always wired as public scripts.
     */
    private void stubStartBattle(
            Optional<Robot>       robotAPreset,
            Optional<CustomRobot> robotACustom,
            Optional<Robot>       robotBPreset,
            Optional<CustomRobot> robotBCustom) {

        robotAPreset.ifPresent(r  -> given(robotRepository.findById(r.getId())).willReturn(Optional.of(r)));
        robotACustom.ifPresent(cr -> given(customRobotRepository.findById(cr.getId())).willReturn(Optional.of(cr)));
        robotBPreset.ifPresent(r  -> given(robotRepository.findById(r.getId())).willReturn(Optional.of(r)));
        robotBCustom.ifPresent(cr -> given(customRobotRepository.findById(cr.getId())).willReturn(Optional.of(cr)));

        Script scriptA = Script.builder().id(10L).build();
        Script scriptB = Script.builder().id(11L).build();
        given(scriptRepository.findById(10L)).willReturn(Optional.of(scriptA));
        given(scriptRepository.findById(11L)).willReturn(Optional.of(scriptB));

        given(battleRepository.findByBattleCode(any())).willReturn(Optional.empty());
        given(battleEngine.simulate(any(), any(), any(), any(), anyInt()))
                .willReturn(BattleState.builder().log(List.of()).winnerId("A").currentTurn(1).build());
        given(battleRepository.save(any(Battle.class))).willAnswer(inv -> inv.getArgument(0));
    }

    private Battle captureLastSavedBattle() {
        ArgumentCaptor<Battle> captor = ArgumentCaptor.forClass(Battle.class);
        verify(battleRepository).save(captor.capture());
        return captor.getValue();
    }
}
