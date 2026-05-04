package com.algorig.algorig_backend.controller;

import com.algorig.algorig_backend.dto.ScriptDto;
import com.algorig.algorig_backend.dto.ScriptSaveRequestDto;
import com.algorig.algorig_backend.dto.ScriptValidationResultDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/scripts")
public class ScriptController {

    @GetMapping("/{id}")
    public ScriptDto getScriptById(@PathVariable Long id) {
        return null;
    }

    @PostMapping
    public ScriptDto createScript(@RequestBody ScriptSaveRequestDto request) {
        return null;
    }

    @PutMapping("/{id}")
    public ScriptDto updateScript(@PathVariable Long id, @RequestBody ScriptSaveRequestDto request) {
        return null;
    }

    @PostMapping("/validate")
    public ScriptValidationResultDto validateScript(@RequestBody ScriptSaveRequestDto request) {
        return ScriptValidationResultDto.builder()
                .valid(true)
                .errors(List.of())
                .build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteScript(@PathVariable Long id) {
        return ResponseEntity.noContent().build();
    }
}
