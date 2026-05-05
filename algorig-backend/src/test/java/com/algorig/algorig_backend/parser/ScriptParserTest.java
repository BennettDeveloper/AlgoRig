package com.algorig.algorig_backend.parser;

import com.algorig.algorig_backend.engine.Action;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ScriptParserTest {

    private ScriptParser parser;

    @BeforeEach
    void setUp() {
        parser = new ScriptParser();
    }

    @Test
    void parsesValidIfElseScript() {
        String script = """
                IF myHP < 35
                    Patch
                    ArmorPlate
                ELSE
                    PowerSurge
                    HardStrike
                END IF
                """;

        ParsedScript result = parser.parse(script);
        List<Object> blocks = result.getBlocks();

        assertEquals(1, blocks.size());
        assertInstanceOf(CodeBlock.class, blocks.get(0));

        CodeBlock ifElse = (CodeBlock) blocks.get(0);
        assertEquals(BlockType.IF_ELSE, ifElse.getType());
        assertEquals("myHP < 35", ifElse.getCondition());

        assertEquals(2, ifElse.getIfBranch().size());
        assertInstanceOf(ActionBlock.class, ifElse.getIfBranch().get(0));
        assertEquals(Action.PATCH, ((ActionBlock) ifElse.getIfBranch().get(0)).getAction());
        assertEquals(Action.ARMOR_PLATE, ((ActionBlock) ifElse.getIfBranch().get(1)).getAction());

        assertEquals(2, ifElse.getElseBranch().size());
        assertEquals(Action.POWER_SURGE, ((ActionBlock) ifElse.getElseBranch().get(0)).getAction());
        assertEquals(Action.HARD_STRIKE, ((ActionBlock) ifElse.getElseBranch().get(1)).getAction());
    }

    @Test
    void parsesNestedIfScript() {
        String script = """
                IF myHP < 50
                    IF myHP < 20
                        Patch
                        Firewall
                        ArmorPlate
                    END IF
                    HardStrike
                END IF
                """;

        ParsedScript result = parser.parse(script);
        List<Object> blocks = result.getBlocks();

        assertEquals(1, blocks.size());
        CodeBlock outer = (CodeBlock) blocks.get(0);
        assertEquals(BlockType.IF, outer.getType());
        assertEquals("myHP < 50", outer.getCondition());
        assertEquals(2, outer.getIfBranch().size());

        CodeBlock inner = (CodeBlock) outer.getIfBranch().get(0);
        assertEquals(BlockType.IF, inner.getType());
        assertEquals("myHP < 20", inner.getCondition());
        assertEquals(3, inner.getIfBranch().size());
        assertEquals(Action.PATCH, ((ActionBlock) inner.getIfBranch().get(0)).getAction());

        assertEquals(Action.HARD_STRIKE, ((ActionBlock) outer.getIfBranch().get(1)).getAction());
    }

    @Test
    void throwsOnUnknownAction() {
        String script = """
                IF myHP < 50
                    LaserBlast
                    Patch
                    HardStrike
                END IF
                """;

        RuntimeException ex = assertThrows(RuntimeException.class, () -> parser.parse(script));
        assertTrue(ex.getMessage().contains("Unknown action: LaserBlast"));
    }

    @Test
    void throwsOnMissingEndIf() {
        String script = """
                IF myHP < 50
                    Patch
                    HardStrike
                    PowerSurge
                """;

        RuntimeException ex = assertThrows(RuntimeException.class, () -> parser.parse(script));
        assertTrue(ex.getMessage().contains("Missing END IF"));
    }
}