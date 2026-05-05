package com.algorig.algorig_backend.controller;

import com.algorig.algorig_backend.dto.RobotDto;
import com.algorig.algorig_backend.service.RobotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/robots")
@RequiredArgsConstructor
public class RobotController {

    private final RobotService robotService;

    @GetMapping
    public List<RobotDto> getAllRobots() {
        return robotService.getAllRobots();
    }

    @GetMapping("/{id}")
    public ResponseEntity<RobotDto> getRobotById(@PathVariable Long id) {
        return robotService.getRobotById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/tier/{tier}")
    public List<RobotDto> getRobotsByTier(@PathVariable int tier) {
        return robotService.getRobotsByMaxTier(tier);
    }
}