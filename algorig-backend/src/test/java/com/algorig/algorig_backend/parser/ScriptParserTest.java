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
    void parsesElseIfChains() {
        String script = """
                IF myHP < 20
                    Patch
                    Patch
                    Patch
                ELSE IF myHP < 50
                    ArmorPlate
                    Patch
                    HardStrike
                ELSE IF enemyHP < 30
                    PowerSurge
                    HardStrike
                    HardStrike
                ELSE
                    HardStrike
                    HardStrike
                    PowerSurge
                END IF
                """;

        ParsedScript result = parser.parse(script);
        List<Object> blocks = result.getBlocks();

        assertEquals(1, blocks.size());
        CodeBlock cb = (CodeBlock) blocks.get(0);
        assertEquals(BlockType.IF_ELSE, cb.getType());
        assertEquals("myHP < 20", cb.getCondition());

        // IF branch
        assertEquals(3, cb.getIfBranch().size());
        assertEquals(Action.PATCH, ((ActionBlock) cb.getIfBranch().get(0)).getAction());

        // ELSE IF chains
        assertEquals(2, cb.getElseIfChains().size());
        CodeBlock.ElseIfChain chain0 = cb.getElseIfChains().get(0);
        assertEquals("myHP < 50", chain0.getCondition());
        assertEquals(3, chain0.getChildren().size());
        assertEquals(Action.ARMOR_PLATE, ((ActionBlock) chain0.getChildren().get(0)).getAction());

        CodeBlock.ElseIfChain chain1 = cb.getElseIfChains().get(1);
        assertEquals("enemyHP < 30", chain1.getCondition());
        assertEquals(3, chain1.getChildren().size());
        assertEquals(Action.POWER_SURGE, ((ActionBlock) chain1.getChildren().get(0)).getAction());

        // ELSE branch
        assertEquals(3, cb.getElseBranch().size());
        assertEquals(Action.HARD_STRIKE, ((ActionBlock) cb.getElseBranch().get(0)).getAction());
    }

    @Test
    void throwsOnElseIfWithoutIf() {
        String script = "ELSE IF myHP < 50\n    Patch\n    Patch\n    HardStrike\nEND IF\n";
        RuntimeException ex = assertThrows(RuntimeException.class, () -> parser.parse(script));
        assertTrue(ex.getMessage().contains("ELSE IF without matching IF"));
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