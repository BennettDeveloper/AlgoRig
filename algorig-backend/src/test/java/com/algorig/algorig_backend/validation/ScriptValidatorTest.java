package com.algorig.algorig_backend.validation;

import com.algorig.algorig_backend.dto.ScriptValidationResultDto;
import com.algorig.algorig_backend.parser.ScriptParser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ScriptValidatorTest {

    private ScriptValidator validator;

    @BeforeEach
    void setUp() {
        validator = new ScriptValidator(new ScriptParser());
    }

    // -------------------------------------------------------------------------
    // Valid scripts
    // -------------------------------------------------------------------------

    @Test
    void validScript_passesValidation() {
        String script = """
                IF myHP < 50
                    HardStrike
                    Patch
                END IF
                HeavyAttack
                """;
        ScriptValidationResultDto result = validator.validate(script);
        assertTrue(result.isValid(), "Expected valid; errors: " + result.getErrors());
        assertTrue(result.getErrors().isEmpty());
    }

    @Test
    void scriptWithValidRepeatBlock_passesValidation() {
        // REPEAT expands at parse time: 3 inline HardStrike entries satisfy the ≥3 action rule
        String script = """
                IF myHP < 50
                    REPEAT 3
                        HardStrike
                    END REPEAT
                END IF
                """;
        ScriptValidationResultDto result = validator.validate(script);
        assertTrue(result.isValid(), "Expected valid; errors: " + result.getErrors());
    }

    @Test
    void scriptWithAllValidActionNames_passesValidation() {
        // Confirms every action name the parser supports is accepted by the validator
        String script = """
                IF myHP < 50
                    HardStrike
                    HeavyAttack
                    PowerSurge
                ELSE
                    VirusUpload
                    Patch
                    ArmorPlate
                    Firewall
                    SystemScan
                    StackOverflow
                    BatteryEqualization
                END IF
                CpuStall
                """;
        ScriptValidationResultDto result = validator.validate(script);
        assertTrue(result.isValid(), "Expected valid; errors: " + result.getErrors());
    }

    @Test
    void scriptWithElseIfChain_passesValidation() {
        String script = """
                IF myHP < 20
                    Patch
                    Patch
                    Patch
                ELSE IF myHP < 50
                    HardStrike
                    Patch
                    HeavyAttack
                ELSE
                    HardStrike
                    HardStrike
                    PowerSurge
                END IF
                """;
        ScriptValidationResultDto result = validator.validate(script);
        assertTrue(result.isValid(), "Expected valid; errors: " + result.getErrors());
    }

    // -------------------------------------------------------------------------
    // Empty / null input
    // -------------------------------------------------------------------------

    @Test
    void emptyString_failsValidation() {
        ScriptValidationResultDto result = validator.validate("");
        assertFalse(result.isValid());
        assertFalse(result.getErrors().isEmpty());
    }

    @Test
    void blankString_failsValidation() {
        ScriptValidationResultDto result = validator.validate("   \n  \n  ");
        assertFalse(result.isValid());
        assertFalse(result.getErrors().isEmpty());
    }

    @Test
    void nullInput_returnsInvalidWithoutThrowing() {
        // ScriptValidator guards: if (content == null || content.isBlank())
        ScriptValidationResultDto result = assertDoesNotThrow(() -> validator.validate(null));
        assertFalse(result.isValid());
        assertFalse(result.getErrors().isEmpty());
    }

    // -------------------------------------------------------------------------
    // Action count rule (≥ 3)
    // -------------------------------------------------------------------------

    @Test
    void scriptWithFewerThanThreeActions_failsValidation() {
        String script = """
                IF myHP < 50
                    HardStrike
                    Patch
                END IF
                """;
        // 2 actions — fails the ≥3 rule
        ScriptValidationResultDto result = validator.validate(script);
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream().anyMatch(e -> e.contains("3 actions")),
                "Expected 'at least 3 actions' error; got: " + result.getErrors());
    }

    @Test
    void scriptWithNoActions_failsValidation() {
        // Parser accepts empty IF body; validator rejects it (0 actions, empty branch)
        String script = """
                IF myHP < 50
                END IF
                """;
        ScriptValidationResultDto result = validator.validate(script);
        assertFalse(result.isValid());
    }

    // -------------------------------------------------------------------------
    // IF block rule (≥ 1)
    // -------------------------------------------------------------------------

    @Test
    void scriptWithNoIfBlock_failsValidation() {
        // 3 valid actions but no IF block
        String script = """
                HardStrike
                Patch
                HeavyAttack
                """;
        ScriptValidationResultDto result = validator.validate(script);
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream().anyMatch(e -> e.contains("IF block")),
                "Expected 'at least 1 IF block' error; got: " + result.getErrors());
    }

    // -------------------------------------------------------------------------
    // Parse errors propagated as validation errors
    // -------------------------------------------------------------------------

    @Test
    void scriptWithUnknownAction_failsValidation() {
        String script = """
                IF myHP < 50
                    LaserBlast
                    HardStrike
                    Patch
                END IF
                """;
        ScriptValidationResultDto result = validator.validate(script);
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream().anyMatch(e -> e.contains("LaserBlast")),
                "Expected error mentioning 'LaserBlast'; got: " + result.getErrors());
    }

    @Test
    void scriptWithUnclosedIfBlock_failsValidation() {
        String script = """
                IF myHP < 50
                    HardStrike
                    Patch
                    HeavyAttack
                """;
        ScriptValidationResultDto result = validator.validate(script);
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream().anyMatch(e -> e.contains("END IF") || e.contains("Missing")),
                "Expected 'Missing END IF' error; got: " + result.getErrors());
    }

    // -------------------------------------------------------------------------
    // Empty branch rule
    // -------------------------------------------------------------------------

    @Test
    void scriptWithEmptyIfBranch_failsValidation() {
        // Parser permits empty IF body; validator must reject it
        String script = """
                IF myHP < 50
                END IF
                HardStrike
                Patch
                HeavyAttack
                """;
        ScriptValidationResultDto result = validator.validate(script);
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream().anyMatch(e -> e.contains("empty branch")),
                "Expected 'empty branch' error; got: " + result.getErrors());
    }
}
