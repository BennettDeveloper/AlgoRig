package com.algorig.algorig_backend.validation;

import com.algorig.algorig_backend.dto.ScriptValidationResultDto;
import com.algorig.algorig_backend.parser.ActionBlock;
import com.algorig.algorig_backend.parser.CodeBlock;
import com.algorig.algorig_backend.parser.ParsedScript;
import com.algorig.algorig_backend.parser.ScriptParser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ScriptValidator {

    private final ScriptParser scriptParser;

    public ScriptValidationResultDto validate(String content) {
        List<String> errors = new ArrayList<>();

        if (content == null || content.isBlank()) {
            errors.add("Script content is empty");
            return ScriptValidationResultDto.builder().valid(false).errors(errors).build();
        }

        ParsedScript parsed;
        try {
            parsed = scriptParser.parse(content);
        } catch (RuntimeException e) {
            errors.add(e.getMessage());
            return ScriptValidationResultDto.builder().valid(false).errors(errors).build();
        }

        if (countActions(parsed.getBlocks()) < 3) {
            errors.add("Script must contain at least 3 actions");
        }

        if (countIfBlocks(parsed.getBlocks()) < 1) {
            errors.add("Script must contain at least 1 IF block");
        }

        validateBranches(parsed.getBlocks(), errors);

        return ScriptValidationResultDto.builder()
                .valid(errors.isEmpty())
                .errors(errors)
                .build();
    }

    private int countActions(List<Object> blocks) {
        int count = 0;
        for (Object block : blocks) {
            if (block instanceof ActionBlock) {
                count++;
            } else if (block instanceof CodeBlock cb) {
                count += countActions(cb.getIfBranch());
                count += countActions(cb.getElseBranch());
            }
        }
        return count;
    }

    private int countIfBlocks(List<Object> blocks) {
        int count = 0;
        for (Object block : blocks) {
            if (block instanceof CodeBlock cb) {
                count++;
                count += countIfBlocks(cb.getIfBranch());
                count += countIfBlocks(cb.getElseBranch());
            }
        }
        return count;
    }

    private void validateBranches(List<Object> blocks, List<String> errors) {
        for (Object block : blocks) {
            if (block instanceof CodeBlock cb) {
                if (cb.getIfBranch().isEmpty()) {
                    errors.add("IF block at condition '" + cb.getCondition() + "' has an empty branch");
                }
                validateBranches(cb.getIfBranch(), errors);
                validateBranches(cb.getElseBranch(), errors);
            }
        }
    }
}