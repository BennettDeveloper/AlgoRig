package com.algorig.algorig_backend.service;

import com.algorig.algorig_backend.dto.RobotDto;
import com.algorig.algorig_backend.model.entity.Robot;
import com.algorig.algorig_backend.repository.RobotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RobotService {

    private final RobotRepository robotRepository;

    public List<RobotDto> getAllRobots() {
        return robotRepository.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    public Optional<RobotDto> getRobotById(Long id) {
        return robotRepository.findById(id).map(this::toDto);
    }

    public List<RobotDto> getRobotsByMaxTier(int tier) {
        return robotRepository.findByTierLessThanEqual(tier).stream()
                .map(this::toDto)
                .toList();
    }

    private RobotDto toDto(Robot robot) {
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