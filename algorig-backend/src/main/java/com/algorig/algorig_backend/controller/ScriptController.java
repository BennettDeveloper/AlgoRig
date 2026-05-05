package com.algorig.algorig_backend.controller;

import com.algorig.algorig_backend.dto.ScriptDto;
import com.algorig.algorig_backend.dto.ScriptSaveRequestDto;
import com.algorig.algorig_backend.dto.ScriptValidationResultDto;
import com.algorig.algorig_backend.service.ScriptService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/scripts")
@RequiredArgsConstructor
public class ScriptController {

    private final ScriptService scriptService;

    @GetMapping("/{id}")
    public ResponseEntity<ScriptDto> getScriptById(@PathVariable Long id) {
        return scriptService.getScriptById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ScriptDto createScript(@RequestBody ScriptSaveRequestDto request) {
        return scriptService.saveScript(request);
    }

    @PutMapping("/{id}")
    public ScriptDto updateScript(@PathVariable Long id, @RequestBody ScriptSaveRequestDto request) {
        return scriptService.updateScript(id, request);
    }

    @PostMapping("/validate")
    public ScriptValidationResultDto validateScript(@RequestBody ScriptSaveRequestDto request) {
        return scriptService.validateScript(request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteScript(@PathVariable Long id) {
        scriptService.deleteScript(id);
        return ResponseEntity.noContent().build();
    }
}