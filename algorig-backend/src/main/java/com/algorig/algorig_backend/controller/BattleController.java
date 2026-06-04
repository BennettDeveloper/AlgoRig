package com.algorig.algorig_backend.controller;

import com.algorig.algorig_backend.dto.BattleDto;
import com.algorig.algorig_backend.dto.BattleRequestDto;
import com.algorig.algorig_backend.model.entity.User;
import com.algorig.algorig_backend.service.BattleService;
import com.algorig.algorig_backend.util.AuthUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/battles")
@RequiredArgsConstructor
public class BattleController {

    private final BattleService battleService;

    @PostMapping
    public BattleDto startBattle(@RequestBody BattleRequestDto request) {
        User user = AuthUtil.getCurrentUser();
        return battleService.startBattle(request, user);
    }

    @GetMapping("/{battleCode}")
    public ResponseEntity<BattleDto> getBattleById(@PathVariable String battleCode) {
        User user = AuthUtil.getCurrentUser();
        return ResponseEntity.ok(battleService.getBattle(battleCode, user));
    }

    @GetMapping
    public List<BattleDto> getUserBattles() {
        User user = AuthUtil.getCurrentUser();
        return battleService.getUserBattles(user);
    }
}
