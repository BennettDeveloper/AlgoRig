package com.algorig.algorig_backend.controller;

import com.algorig.algorig_backend.dto.RobotDto;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/robots")
public class RobotController {

    @GetMapping
    public List<RobotDto> getAllRobots() {
        return List.of();
    }

    @GetMapping("/{id}")
    public RobotDto getRobotById(@PathVariable Long id) {
        return null;
    }

    @GetMapping("/tier/{tier}")
    public List<RobotDto> getRobotsByTier(@PathVariable int tier) {
        return List.of();
    }
}
