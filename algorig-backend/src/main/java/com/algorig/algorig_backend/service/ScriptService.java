package com.algorig.algorig_backend.service;

import com.algorig.algorig_backend.dto.ScriptDto;
import com.algorig.algorig_backend.dto.ScriptSaveRequestDto;
import com.algorig.algorig_backend.dto.ScriptValidationResultDto;
import com.algorig.algorig_backend.model.entity.Script;
import com.algorig.algorig_backend.repository.ScriptRepository;
import com.algorig.algorig_backend.validation.ScriptValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ScriptService {

    private final ScriptRepository scriptRepository;
    private final ScriptValidator scriptValidator;

    public Optional<ScriptDto> getScriptById(Long id) {
        return scriptRepository.findById(id).map(this::toDto);
    }

    public ScriptDto saveScript(ScriptSaveRequestDto request) {
        Script script = Script.builder()
                .name(request.getName())
                .content(request.getContent())
                .build();
        return toDto(scriptRepository.save(script));
    }

    public ScriptDto updateScript(Long id, ScriptSaveRequestDto request) {
        Script script = scriptRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Script not found"));
        script.setName(request.getName());
        script.setContent(request.getContent());
        return toDto(scriptRepository.save(script));
    }

    public void deleteScript(Long id) {
        scriptRepository.deleteById(id);
    }

    public ScriptValidationResultDto validateScript(ScriptSaveRequestDto request) {
        return scriptValidator.validate(request.getContent());
    }

    private ScriptDto toDto(Script script) {
        return ScriptDto.builder()
                .id(script.getId())
                .name(script.getName())
                .content(script.getContent())
                .version(script.getVersion())
                .createdAt(script.getCreatedAt())
                .updatedAt(script.getUpdatedAt())
                .build();
    }
}