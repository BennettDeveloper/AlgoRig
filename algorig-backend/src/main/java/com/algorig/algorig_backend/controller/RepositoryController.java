package com.algorig.algorig_backend.controller;

import com.algorig.algorig_backend.dto.BattleDto;
import com.algorig.algorig_backend.dto.ScriptDetailDto;
import com.algorig.algorig_backend.dto.ScriptSummaryDto;
import com.algorig.algorig_backend.service.RepositoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/repository")
@RequiredArgsConstructor
public class RepositoryController {

    private final RepositoryService repositoryService;

    @GetMapping
    public Page<ScriptSummaryDto> getPublicScripts(
            @RequestParam(defaultValue = "0")        int page,
            @RequestParam(defaultValue = "12")       int size,
            @RequestParam(defaultValue = "mostUsed") String sort,
            @RequestParam(defaultValue = "0")        int minBattles,
            @RequestParam(defaultValue = "")         String search,
            @RequestParam(defaultValue = "")         String authorUsername,
            @RequestParam(defaultValue = "false")    boolean requirementsOnly) {

        int cappedSize = Math.min(size, 48);
        return repositoryService.getPublicScripts(
                search, authorUsername, sort, minBattles,
                requirementsOnly, PageRequest.of(page, cappedSize));
    }

    @GetMapping("/{id}")
    public ScriptDetailDto getScriptDetail(@PathVariable Long id) {
        return repositoryService.getScriptDetail(id);
    }

    @GetMapping("/{id}/battles")
    public Page<BattleDto> getScriptBattles(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {

        return repositoryService.getScriptBattles(id, PageRequest.of(page, size));
    }
}
