package com.algorig.algorig_backend.controller;

import com.algorig.algorig_backend.dto.LeaderboardEntryDto;
import com.algorig.algorig_backend.service.LeaderboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/leaderboard")
@RequiredArgsConstructor
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    @GetMapping("/wins")
    public Page<LeaderboardEntryDto> getByTotalWins(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return leaderboardService.getByTotalWins(PageRequest.of(page, size));
    }

    @GetMapping("/winrate")
    public Page<LeaderboardEntryDto> getByWinRate(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return leaderboardService.getByWinRate(PageRequest.of(page, size));
    }

    @GetMapping("/streak")
    public Page<LeaderboardEntryDto> getByBestStreak(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return leaderboardService.getByBestStreak(PageRequest.of(page, size));
    }
}
