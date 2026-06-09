package com.algorig.algorig_backend.service;

import com.algorig.algorig_backend.dto.CustomRobotRequest;
import com.algorig.algorig_backend.dto.CustomRobotResponse;
import com.algorig.algorig_backend.engine.RobotPassive;
import com.algorig.algorig_backend.model.entity.CustomRobot;
import com.algorig.algorig_backend.model.entity.User;
import com.algorig.algorig_backend.model.enums.RobotTier;
import com.algorig.algorig_backend.repository.CustomRobotRepository;
import com.algorig.algorig_backend.util.AuthUtil;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CustomRobotService {

    private final CustomRobotRepository customRobotRepository;

    // ── Tier constraints ─────────────────────────────────────────────────────

    private record TierLimits(
            int budget,
            int maxHp, int maxCoreImpact, int maxExploitPower,
            int maxClockSpeed, int maxChassisArmor,
            int maxFirewallStrength, int maxBattery
    ) {}

    private static final Map<RobotTier, TierLimits> TIER_LIMITS = Map.of(
        RobotTier.TIER_1, new TierLimits(200,  80,  20,  20,  30,  20,  20,  60),
        RobotTier.TIER_2, new TierLimits(270, 110,  35,  35,  45,  35,  35,  75),
        RobotTier.TIER_3, new TierLimits(350, 140,  50,  50,  60,  50,  50,  85),
        RobotTier.TIER_4, new TierLimits(440, 170,  65,  65,  75,  65,  65,  90),
        RobotTier.TIER_5, new TierLimits(540, 200,  80,  80,  90,  80,  80, 100)
    );

    private static final int FLOOR_HP               = 30;
    private static final int FLOOR_CORE_IMPACT       = 5;
    private static final int FLOOR_EXPLOIT_POWER     = 5;
    private static final int FLOOR_CLOCK_SPEED       = 5;
    private static final int FLOOR_CHASSIS_ARMOR     = 5;
    private static final int FLOOR_FIREWALL_STRENGTH = 5;
    private static final int FLOOR_BATTERY           = 20;

    // ── Allowed passives per tier (cumulative) ───────────────────────────────

    private static final Set<RobotPassive> TIER_1_PASSIVES = EnumSet.of(
        RobotPassive.QUICK_REFLEXES, RobotPassive.DEBUG_PROTOCOL,
        RobotPassive.SELF_REPAIR, RobotPassive.IRON_WILL, RobotPassive.RESILIENT_FRAME
    );

    private static final Set<RobotPassive> TIER_2_PASSIVES = EnumSet.copyOf(TIER_1_PASSIVES);
    static {
        TIER_2_PASSIVES.addAll(EnumSet.of(
            RobotPassive.ADAPTIVE_COMBAT, RobotPassive.FORTIFIED_STRUCTURE,
            RobotPassive.VITAL_SYSTEMS, RobotPassive.CASCADING_OVERFLOW,
            RobotPassive.MOMENTUM, RobotPassive.UNBREAKABLE
        ));
    }

    private static final Set<RobotPassive> TIER_3_PASSIVES = EnumSet.copyOf(TIER_2_PASSIVES);
    static {
        TIER_3_PASSIVES.addAll(EnumSet.of(
            RobotPassive.COMBAT_RHYTHM, RobotPassive.PHASE_SHIFT,
            RobotPassive.PERMAFROST, RobotPassive.EMERGENCY_PROTOCOL,
            RobotPassive.OVERCHARGE, RobotPassive.INFECTION, RobotPassive.NETWORK_SHIELD
        ));
    }

    private static final Set<RobotPassive> TIER_4_PASSIVES = EnumSet.copyOf(TIER_3_PASSIVES);
    static {
        TIER_4_PASSIVES.addAll(EnumSet.of(
            RobotPassive.LETHAL_EDGE, RobotPassive.SILENT_EXECUTION,
            RobotPassive.LIFE_PULSE, RobotPassive.TEMPEST, RobotPassive.REINFORCED
        ));
    }

    private static final Set<RobotPassive> TIER_5_PASSIVES = EnumSet.allOf(RobotPassive.class);

    private static final Map<RobotTier, Set<RobotPassive>> ALLOWED_PASSIVES = Map.of(
        RobotTier.TIER_1, TIER_1_PASSIVES,
        RobotTier.TIER_2, TIER_2_PASSIVES,
        RobotTier.TIER_3, TIER_3_PASSIVES,
        RobotTier.TIER_4, TIER_4_PASSIVES,
        RobotTier.TIER_5, TIER_5_PASSIVES
    );

    // ── Public API ────────────────────────────────────────────────────────────

    @Transactional
    public CustomRobotResponse createCustomRobot(CustomRobotRequest request) {
        Long userId = getCurrentUserId();
        validate(request, null, userId);

        User userRef = new User();
        userRef.setId(userId);

        CustomRobot robot = CustomRobot.builder()
                .user(userRef)
                .name(request.getName().trim())
                .tier(request.getTier())
                .hp(request.getHp())
                .coreImpact(request.getCoreImpact())
                .exploitPower(request.getExploitPower())
                .clockSpeed(request.getClockSpeed())
                .chassisArmor(request.getChassisArmor())
                .firewallStrength(request.getFirewallStrength())
                .battery(request.getBattery())
                .passiveAbility(request.getPassiveAbility())
                .partsConfig(request.getPartsConfig())
                .build();

        return CustomRobotResponse.fromEntity(customRobotRepository.save(robot));
    }

    @Transactional(readOnly = true)
    public List<CustomRobotResponse> getMyRobots() {
        return customRobotRepository.findByUserId(getCurrentUserId())
                .stream()
                .map(CustomRobotResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public CustomRobotResponse getMyRobotById(Long id) {
        return CustomRobotResponse.fromEntity(requireOwned(id));
    }

    @Transactional
    public CustomRobotResponse updateCustomRobot(Long id, CustomRobotRequest request) {
        Long userId = getCurrentUserId();
        CustomRobot robot = requireOwned(id);

        validate(request, id, userId);

        robot.setName(request.getName().trim());
        robot.setTier(request.getTier());
        robot.setHp(request.getHp());
        robot.setCoreImpact(request.getCoreImpact());
        robot.setExploitPower(request.getExploitPower());
        robot.setClockSpeed(request.getClockSpeed());
        robot.setChassisArmor(request.getChassisArmor());
        robot.setFirewallStrength(request.getFirewallStrength());
        robot.setBattery(request.getBattery());
        robot.setPassiveAbility(request.getPassiveAbility());
        robot.setPartsConfig(request.getPartsConfig());

        return CustomRobotResponse.fromEntity(customRobotRepository.save(robot));
    }

    @Transactional
    public void deleteCustomRobot(Long id) {
        customRobotRepository.delete(requireOwned(id));
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    private Long getCurrentUserId() {
        Long id = AuthUtil.getCurrentUserId();
        return id != null ? id : 1L; // stub — wired properly via AuthUtil in production
    }

    private CustomRobot requireOwned(Long id) {
        return customRobotRepository.findByIdAndUserId(id, getCurrentUserId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Custom robot not found or does not belong to you. id=" + id));
    }

    private void validate(CustomRobotRequest req, Long excludeId, Long userId) {
        RobotTier tier = req.getTier();
        TierLimits lim = TIER_LIMITS.get(tier);
        int tierNum = tier.getValue();

        // 1. Stat floors
        if (req.getHp()               < FLOOR_HP)
            throw new IllegalArgumentException("HP must be at least " + FLOOR_HP + ". You allocated " + req.getHp() + ".");
        if (req.getCoreImpact()       < FLOOR_CORE_IMPACT)
            throw new IllegalArgumentException("Core Impact must be at least " + FLOOR_CORE_IMPACT + ". You allocated " + req.getCoreImpact() + ".");
        if (req.getExploitPower()     < FLOOR_EXPLOIT_POWER)
            throw new IllegalArgumentException("Exploit Power must be at least " + FLOOR_EXPLOIT_POWER + ". You allocated " + req.getExploitPower() + ".");
        if (req.getClockSpeed()       < FLOOR_CLOCK_SPEED)
            throw new IllegalArgumentException("Clock Speed must be at least " + FLOOR_CLOCK_SPEED + ". You allocated " + req.getClockSpeed() + ".");
        if (req.getChassisArmor()     < FLOOR_CHASSIS_ARMOR)
            throw new IllegalArgumentException("Chassis Armor must be at least " + FLOOR_CHASSIS_ARMOR + ". You allocated " + req.getChassisArmor() + ".");
        if (req.getFirewallStrength() < FLOOR_FIREWALL_STRENGTH)
            throw new IllegalArgumentException("Firewall Strength must be at least " + FLOOR_FIREWALL_STRENGTH + ". You allocated " + req.getFirewallStrength() + ".");
        if (req.getBattery()          < FLOOR_BATTERY)
            throw new IllegalArgumentException("Battery must be at least " + FLOOR_BATTERY + ". You allocated " + req.getBattery() + ".");

        // 2. Point budget
        int total = req.getHp() + req.getCoreImpact() + req.getExploitPower()
                  + req.getClockSpeed() + req.getChassisArmor()
                  + req.getFirewallStrength() + req.getBattery();
        if (total > lim.budget())
            throw new IllegalArgumentException(
                    "Total stat points (" + total + ") exceed the Tier " + tierNum
                    + " budget of " + lim.budget() + ". Remove " + (total - lim.budget()) + " point(s).");

        // 3. Stat ceilings
        if (req.getHp()               > lim.maxHp())
            throw new IllegalArgumentException("HP cannot exceed " + lim.maxHp() + " for a Tier " + tierNum + " robot. You allocated " + req.getHp() + ".");
        if (req.getCoreImpact()       > lim.maxCoreImpact())
            throw new IllegalArgumentException("Core Impact cannot exceed " + lim.maxCoreImpact() + " for a Tier " + tierNum + " robot. You allocated " + req.getCoreImpact() + ".");
        if (req.getExploitPower()     > lim.maxExploitPower())
            throw new IllegalArgumentException("Exploit Power cannot exceed " + lim.maxExploitPower() + " for a Tier " + tierNum + " robot. You allocated " + req.getExploitPower() + ".");
        if (req.getClockSpeed()       > lim.maxClockSpeed())
            throw new IllegalArgumentException("Clock Speed cannot exceed " + lim.maxClockSpeed() + " for a Tier " + tierNum + " robot. You allocated " + req.getClockSpeed() + ".");
        if (req.getChassisArmor()     > lim.maxChassisArmor())
            throw new IllegalArgumentException("Chassis Armor cannot exceed " + lim.maxChassisArmor() + " for a Tier " + tierNum + " robot. You allocated " + req.getChassisArmor() + ".");
        if (req.getFirewallStrength() > lim.maxFirewallStrength())
            throw new IllegalArgumentException("Firewall Strength cannot exceed " + lim.maxFirewallStrength() + " for a Tier " + tierNum + " robot. You allocated " + req.getFirewallStrength() + ".");
        if (req.getBattery()          > lim.maxBattery())
            throw new IllegalArgumentException("Battery cannot exceed " + lim.maxBattery() + " for a Tier " + tierNum + " robot. You allocated " + req.getBattery() + ".");

        // 4. Passive gating
        if (!ALLOWED_PASSIVES.get(tier).contains(req.getPassiveAbility()))
            throw new IllegalArgumentException(
                    "Passive ability '" + req.getPassiveAbility().getDisplayName()
                    + "' is not available for Tier " + tierNum + " robots.");

        // 5. Duplicate name (exclude current robot on update)
        String trimmedName = req.getName().trim();
        if (customRobotRepository.existsByUserIdAndName(userId, trimmedName)) {
            boolean isSelf = excludeId != null && customRobotRepository
                    .findByIdAndUserId(excludeId, userId)
                    .map(r -> r.getName().equals(trimmedName))
                    .orElse(false);
            if (!isSelf) {
                throw new IllegalArgumentException(
                        "You already have a custom robot named '" + trimmedName + "'. Choose a different name.");
            }
        }
    }
}
