package com.algorig.algorig_backend.parser;

import com.algorig.algorig_backend.engine.Action;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Covers parser features absent from ScriptParserTest:
 * REPEAT blocks, SET/UPDATE memory blocks, error cases for missing END REPEAT,
 * nested structures, and whitespace tolerance.
 */
class ScriptParserGapsTest {

    private ScriptParser parser;

    @BeforeEach
    void setUp() {
        parser = new ScriptParser();
    }

    // =========================================================================
    // REPEAT block — flat expansion structure
    // =========================================================================

    @Test
    void parsesRepeatBlock_withCorrectIterationCount() {
        // REPEAT 3 expands to 7 top-level blocks:
        //   RepeatMarkerBlock("START",1,3), ActionBlock(HARD_STRIKE),
        //   RepeatMarkerBlock("LOOP",2,3),  ActionBlock(HARD_STRIKE),
        //   RepeatMarkerBlock("LOOP",3,3),  ActionBlock(HARD_STRIKE),
        //   RepeatMarkerBlock("END",3,3)
        ParsedScript result = parser.parse("REPEAT 3\n  HardStrike\nEND REPEAT");
        List<Object> blocks = result.getBlocks();

        assertEquals(7, blocks.size(), "REPEAT 3 with 1 body action must produce 7 flat blocks");

        // First block: START marker
        assertInstanceOf(RepeatMarkerBlock.class, blocks.get(0));
        RepeatMarkerBlock start = (RepeatMarkerBlock) blocks.get(0);
        assertEquals("START", start.getMarkerType());
        assertEquals(1, start.getIteration());
        assertEquals(3, start.getTotal());

        // Second block: first HardStrike
        assertInstanceOf(ActionBlock.class, blocks.get(1));
        assertEquals(Action.HARD_STRIKE, ((ActionBlock) blocks.get(1)).getAction());

        // Third block: LOOP marker for iteration 2
        assertInstanceOf(RepeatMarkerBlock.class, blocks.get(2));
        assertEquals("LOOP", ((RepeatMarkerBlock) blocks.get(2)).getMarkerType());
        assertEquals(2, ((RepeatMarkerBlock) blocks.get(2)).getIteration());

        // Last block: END marker
        assertInstanceOf(RepeatMarkerBlock.class, blocks.get(6));
        assertEquals("END", ((RepeatMarkerBlock) blocks.get(6)).getMarkerType());
        assertEquals(3, ((RepeatMarkerBlock) blocks.get(6)).getTotal());
    }

    @Test
    void parsesRepeatBlock_actionRepeatedExactTimes() {
        // Count the ActionBlocks in the expanded flat list
        ParsedScript result = parser.parse("REPEAT 5\n  Patch\nEND REPEAT");
        long actionCount = result.getBlocks().stream()
                .filter(b -> b instanceof ActionBlock ab && ab.getAction() == Action.PATCH)
                .count();
        assertEquals(5, actionCount, "REPEAT 5 must produce exactly 5 PATCH ActionBlocks");
    }

    // =========================================================================
    // SET memory block
    // =========================================================================

    @Test
    void parsesSetMemoryBlock_insideIfBranch() {
        ParsedScript result = parser.parse("""
                IF myHP < 50
                  SET myVar = 10
                  HardStrike
                END IF
                """);

        List<Object> blocks = result.getBlocks();
        assertEquals(1, blocks.size());
        assertInstanceOf(CodeBlock.class, blocks.get(0));

        CodeBlock cb = (CodeBlock) blocks.get(0);
        assertEquals(2, cb.getIfBranch().size());
        assertInstanceOf(SetBlock.class, cb.getIfBranch().get(0));
        SetBlock sb = (SetBlock) cb.getIfBranch().get(0);
        assertEquals("myVar", sb.getVariableName());
        assertEquals("10", sb.getExpression());

        // Action after SET is still present
        assertInstanceOf(ActionBlock.class, cb.getIfBranch().get(1));
        assertEquals(Action.HARD_STRIKE, ((ActionBlock) cb.getIfBranch().get(1)).getAction());
    }

    @Test
    void parsesSetMemoryBlock_atTopLevel() {
        ParsedScript result = parser.parse("SET counter = 0\nHardStrike");
        List<Object> blocks = result.getBlocks();

        assertEquals(2, blocks.size());
        assertInstanceOf(SetBlock.class, blocks.get(0));
        SetBlock sb = (SetBlock) blocks.get(0);
        assertEquals("counter", sb.getVariableName());
        assertEquals("0", sb.getExpression());
    }

    @Test
    void throwsOnSetWithReadOnlyVariable() {
        // myHP is a read-only variable; SET must reject it
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> parser.parse("SET myHP = 100"));
        assertTrue(ex.getMessage().contains("Cannot SET read-only variable"),
                "Expected 'Cannot SET read-only variable' but got: " + ex.getMessage());
    }

    // =========================================================================
    // UPDATE memory block
    // =========================================================================

    @Test
    void parsesUpdateMemoryBlock_plusEquals() {
        ParsedScript result = parser.parse("UPDATE counter += 1");
        List<Object> blocks = result.getBlocks();

        assertEquals(1, blocks.size());
        assertInstanceOf(UpdateBlock.class, blocks.get(0));
        UpdateBlock ub = (UpdateBlock) blocks.get(0);
        assertEquals("counter", ub.getVariableName());
        assertEquals("+=", ub.getOperator());
        assertEquals("1", ub.getExpression());
    }

    @Test
    void parsesUpdateMemoryBlock_allOperators() {
        // Verify each operator parses correctly
        String[] operators = {"+=", "-=", "*=", "/=", "%="};
        for (String op : operators) {
            ParsedScript result = parser.parse("UPDATE x " + op + " 5");
            UpdateBlock ub = (UpdateBlock) result.getBlocks().get(0);
            assertEquals(op, ub.getOperator(), "Operator " + op + " must parse correctly");
            assertEquals("5", ub.getExpression());
        }
    }

    // =========================================================================
    // Error cases
    // =========================================================================

    @Test
    void throwsOnMissingEndRepeat() {
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> parser.parse("REPEAT 3\n  HardStrike\n"));
        assertTrue(ex.getMessage().contains("END REPEAT"),
                "Exception must mention END REPEAT; got: " + ex.getMessage());
    }

    @Test
    void throwsOnEndRepeatWithoutRepeat() {
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> parser.parse("HardStrike\nEND REPEAT"));
        assertTrue(ex.getMessage().contains("END REPEAT"),
                "Exception must mention END REPEAT mismatch; got: " + ex.getMessage());
    }

    @Test
    void throwsOnRepeatCountOutOfRange() {
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> parser.parse("REPEAT 11\n  HardStrike\nEND REPEAT"));
        assertTrue(ex.getMessage().contains("10"),
                "Exception must mention the max count limit; got: " + ex.getMessage());
    }

    @Test
    void throwsOnEmptyRepeatBody() {
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> parser.parse("REPEAT 3\nEND REPEAT"));
        assertTrue(ex.getMessage().toLowerCase().contains("empty") ||
                   ex.getMessage().contains("body"),
                "Exception must mention empty body; got: " + ex.getMessage());
    }

    // =========================================================================
    // Nested REPEAT inside IF
    // =========================================================================

    @Test
    void parsesNestedRepeatInsideIf() {
        // REPEAT inside IF branch expands into flat blocks WITHIN that branch
        ParsedScript result = parser.parse("""
                IF myHP < 50
                  REPEAT 2
                    HardStrike
                  END REPEAT
                END IF
                """);

        List<Object> blocks = result.getBlocks();
        assertEquals(1, blocks.size(), "Top level must have one CodeBlock");
        assertInstanceOf(CodeBlock.class, blocks.get(0));

        CodeBlock cb = (CodeBlock) blocks.get(0);
        // REPEAT 2 with 1 body action = 5 expanded blocks in the IF branch:
        //   START, HardStrike, LOOP, HardStrike, END
        assertEquals(5, cb.getIfBranch().size(),
                "IF branch must contain 5 blocks from REPEAT 2 expansion");

        assertInstanceOf(RepeatMarkerBlock.class, cb.getIfBranch().get(0));
        assertEquals("START", ((RepeatMarkerBlock) cb.getIfBranch().get(0)).getMarkerType());
        assertInstanceOf(ActionBlock.class, cb.getIfBranch().get(1));
        assertEquals(Action.HARD_STRIKE, ((ActionBlock) cb.getIfBranch().get(1)).getAction());
        assertInstanceOf(RepeatMarkerBlock.class, cb.getIfBranch().get(4));
        assertEquals("END", ((RepeatMarkerBlock) cb.getIfBranch().get(4)).getMarkerType());
    }

    // =========================================================================
    // Whitespace tolerance
    // =========================================================================

    @Test
    void toleratesLeadingAndTrailingWhitespace() {
        // Leading blank lines, indented actions, trailing newlines
        ParsedScript result = parser.parse("\n\n  HardStrike\n\n  Patch\n\n");
        List<Object> blocks = result.getBlocks();

        assertEquals(2, blocks.size(), "Should parse exactly 2 ActionBlocks");
        assertEquals(Action.HARD_STRIKE, ((ActionBlock) blocks.get(0)).getAction());
        assertEquals(Action.PATCH,       ((ActionBlock) blocks.get(1)).getAction());
    }

    @Test
    void toleratesExtraIndentationInsideBlocks() {
        // Deep indentation should not affect parsing
        ParsedScript result = parser.parse("""
                IF myHP < 50
                        HardStrike
                END IF
                """);

        CodeBlock cb = (CodeBlock) result.getBlocks().get(0);
        assertEquals(1, cb.getIfBranch().size());
        assertEquals(Action.HARD_STRIKE, ((ActionBlock) cb.getIfBranch().get(0)).getAction());
    }

    // =========================================================================
    // ELSE branch containing REPEAT
    // =========================================================================

    @Test
    void parsesElseWithRepeatInBranch() {
        ParsedScript result = parser.parse("""
                IF myHP > 50
                  Patch
                ELSE
                  REPEAT 2
                    HardStrike
                  END REPEAT
                END IF
                """);

        List<Object> blocks = result.getBlocks();
        assertEquals(1, blocks.size());
        CodeBlock cb = (CodeBlock) blocks.get(0);
        assertEquals(BlockType.IF_ELSE, cb.getType());

        // IF branch: 1 PATCH
        assertEquals(1, cb.getIfBranch().size());
        assertEquals(Action.PATCH, ((ActionBlock) cb.getIfBranch().get(0)).getAction());

        // ELSE branch: REPEAT 2 expansion = 5 blocks
        assertEquals(5, cb.getElseBranch().size(),
                "ELSE branch with REPEAT 2 must produce 5 blocks");
        assertInstanceOf(RepeatMarkerBlock.class, cb.getElseBranch().get(0));
        assertInstanceOf(ActionBlock.class, cb.getElseBranch().get(1));
        assertEquals(Action.HARD_STRIKE, ((ActionBlock) cb.getElseBranch().get(1)).getAction());
    }
}
