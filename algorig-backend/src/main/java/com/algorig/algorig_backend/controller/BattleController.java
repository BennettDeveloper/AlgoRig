package com.algorig.algorig_backend.controller;

import com.algorig.algorig_backend.dto.BattleDto;
import com.algorig.algorig_backend.dto.BattleRequestDto;
import com.algorig.algorig_backend.service.BattleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/battles")
@RequiredArgsConstructor
public class BattleController {

    private final BattleService battleService;

    @PostMapping
    public BattleDto startBattle(@RequestBody BattleRequestDto request) {
        return battleService.startBattle(request);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BattleDto> getBattleById(@PathVariable Long id) {
        return battleService.getBattleById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}