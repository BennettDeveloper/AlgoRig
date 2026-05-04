package com.algorig.algorig_backend.controller;

import com.algorig.algorig_backend.dto.BattleDto;
import com.algorig.algorig_backend.dto.BattleRequestDto;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/battles")
public class BattleController {

    @PostMapping
    public BattleDto startBattle(@RequestBody BattleRequestDto request) {
        return null;
    }

    @GetMapping("/{id}")
    public BattleDto getBattleById(@PathVariable Long id) {
        return null;
    }
}
