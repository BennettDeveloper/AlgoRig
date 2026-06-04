package com.algorig.algorig_backend.controller;

import com.algorig.algorig_backend.dto.PinScriptDto;
import com.algorig.algorig_backend.dto.ScriptDto;
import com.algorig.algorig_backend.dto.ScriptSaveRequestDto;
import com.algorig.algorig_backend.dto.ScriptValidationResultDto;
import com.algorig.algorig_backend.model.entity.User;
import com.algorig.algorig_backend.service.ScriptService;
import com.algorig.algorig_backend.util.AuthUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/scripts")
@RequiredArgsConstructor
public class ScriptController {

    private final ScriptService scriptService;

    @GetMapping
    public List<ScriptDto> getUserScripts() {
        User user = AuthUtil.getCurrentUser();
        return scriptService.getUserScripts(user);
    }

    @GetMapping("/public")
    public List<ScriptDto> getPublicScripts() {
        return scriptService.getPublicScripts();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ScriptDto> getScriptById(@PathVariable Long id) {
        User user = AuthUtil.getCurrentUser();
        return ResponseEntity.ok(scriptService.getScript(id, user));
    }

    @PostMapping
    public ScriptDto createScript(@RequestBody ScriptSaveRequestDto request) {
        User user = AuthUtil.getCurrentUser();
        return scriptService.createScript(request, user);
    }

    @PutMapping("/{id}")
    public ScriptDto updateScript(@PathVariable Long id, @RequestBody ScriptSaveRequestDto request) {
        User user = AuthUtil.getCurrentUser();
        return scriptService.updateScript(id, request, user);
    }

    @PostMapping("/validate")
    public ScriptValidationResultDto validateScript(@RequestBody ScriptSaveRequestDto request) {
        return scriptService.validateScript(request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteScript(@PathVariable Long id) {
        User user = AuthUtil.getCurrentUser();
        scriptService.deleteScript(id, user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/pin")
    public PinScriptDto pinScript(@PathVariable Long id, @RequestParam int order) {
        User user = AuthUtil.getCurrentUser();
        return scriptService.pinScript(id, order, user);
    }

    @DeleteMapping("/{id}/pin")
    public ResponseEntity<Void> unpinScript(@PathVariable Long id) {
        User user = AuthUtil.getCurrentUser();
        scriptService.unpinScript(id, user);
        return ResponseEntity.noContent().build();
    }
}
