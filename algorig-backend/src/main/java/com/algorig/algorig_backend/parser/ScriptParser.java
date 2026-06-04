package com.algorig.algorig_backend.parser;

import com.algorig.algorig_backend.engine.Action;
import org.springframework.stereotype.Component;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import java.util.Set;

@Component
public class ScriptParser {

    private static final int MAX_REPEAT_COUNT = 10;

    private static final Set<String> READ_ONLY_VARS = Set.of(
        "myHP", "enemyHP", "myBattery", "enemyBattery",
        "myArmor", "enemyArmor", "myFirewall", "enemyFirewall",
        "myHeat", "enemyHeat", "turnNumber", "lastMyAction", "lastEnemyAction"
    );

    public ParsedScript parse(String scriptContent) {
        String[] lines = scriptContent.split("\n");

        Deque<CodeBlock> ifStack = new ArrayDeque<>();
        // 0 = in IF branch, -1 = in ELSE branch, n>=1 = in elseIfChains[n-1]
        Deque<Integer> inElseStack = new ArrayDeque<>();
        Deque<List<Object>> repeatBodyStack = new ArrayDeque<>();
        Deque<Integer> repeatCountStack = new ArrayDeque<>();
        Deque<String> frameTypeStack = new ArrayDeque<>(); // "if" or "repeat"
        List<Object> topLevel = new ArrayList<>();

        for (String rawLine : lines) {
            String line = rawLine.trim();
            if (line.isEmpty()) continue;

            String upper = line.toUpperCase();

            if (upper.startsWith("REPEAT ")) {
                String countStr = line.substring(7).trim();
                int count;
                try {
                    count = Integer.parseInt(countStr);
                } catch (NumberFormatException e) {
                    throw new RuntimeException("REPEAT requires a numeric count: " + line);
                }
                if (count < 1 || count > MAX_REPEAT_COUNT) {
                    throw new RuntimeException("REPEAT count must be between 1 and " + MAX_REPEAT_COUNT + ": " + count);
                }
                repeatBodyStack.push(new ArrayList<>());
                repeatCountStack.push(count);
                frameTypeStack.push("repeat");

            } else if (upper.equals("END REPEAT")) {
                if (frameTypeStack.isEmpty() || !"repeat".equals(frameTypeStack.peek())) {
                    throw new RuntimeException("END REPEAT without matching REPEAT");
                }
                frameTypeStack.pop();
                List<Object> body = repeatBodyStack.pop();
                int count = repeatCountStack.pop();
                if (body.isEmpty()) {
                    throw new RuntimeException("REPEAT block body cannot be empty");
                }
                for (int r = 0; r < count; r++) {
                    String markerType = r == 0 ? "START" : "LOOP";
                    addToCurrentContext(
                        new RepeatMarkerBlock(markerType, r + 1, count),
                        frameTypeStack, ifStack, inElseStack, repeatBodyStack, topLevel
                    );
                    for (Object item : body) {
                        addToCurrentContext(item, frameTypeStack, ifStack, inElseStack, repeatBodyStack, topLevel);
                    }
                }
                addToCurrentContext(
                    new RepeatMarkerBlock("END", count, count),
                    frameTypeStack, ifStack, inElseStack, repeatBodyStack, topLevel
                );

            } else if (upper.startsWith("UPDATE ")) {
                String rest = line.substring(7).trim();
                String[] ops = {"+=", "-=", "*=", "/=", "%="};
                boolean matched = false;
                for (String op : ops) {
                    int idx = rest.indexOf(op);
                    if (idx != -1) {
                        String varName = rest.substring(0, idx).trim();
                        String expr    = rest.substring(idx + op.length()).trim();
                        if (varName.isEmpty()) {
                            throw new RuntimeException("UPDATE statement is missing a variable name");
                        }
                        if (!varName.matches("[a-zA-Z][a-zA-Z0-9_]*")) {
                            throw new RuntimeException("Invalid variable name in UPDATE: " + varName);
                        }
                        if (expr.isEmpty()) {
                            throw new RuntimeException("UPDATE " + varName + " has no value expression");
                        }
                        addToCurrentContext(new UpdateBlock(varName, op, expr),
                            frameTypeStack, ifStack, inElseStack, repeatBodyStack, topLevel);
                        matched = true;
                        break;
                    }
                }
                if (!matched) {
                    throw new RuntimeException(
                        "Invalid UPDATE statement: " + line + ". Expected: UPDATE varName += value");
                }

            } else if (upper.startsWith("SET ")) {
                String rest = line.substring(4).trim();
                int eqIdx = rest.indexOf('=');
                if (eqIdx == -1) {
                    throw new RuntimeException("Invalid SET statement (missing '='): " + line);
                }
                String varName = rest.substring(0, eqIdx).trim();
                String expr    = rest.substring(eqIdx + 1).trim();
                if (!varName.matches("[a-zA-Z][a-zA-Z0-9_]*")) {
                    throw new RuntimeException("Invalid variable name '" + varName + "' — must start with a letter");
                }
                if (READ_ONLY_VARS.contains(varName)) {
                    throw new RuntimeException("Cannot SET read-only variable: " + varName);
                }
                if (expr.isEmpty()) {
                    throw new RuntimeException("SET " + varName + " has no value expression");
                }
                addToCurrentContext(new SetBlock(varName, expr), frameTypeStack, ifStack, inElseStack, repeatBodyStack, topLevel);

            } else if (upper.startsWith("IF ")) {
                String condition = line.substring(3).trim();
                CodeBlock block = new CodeBlock(BlockType.IF, condition, new ArrayList<>(), new ArrayList<>());
                ifStack.push(block);
                inElseStack.push(0);
                frameTypeStack.push("if");

            } else if (upper.startsWith("ELSE IF")) {
                if (frameTypeStack.isEmpty() || !"if".equals(frameTypeStack.peek())) {
                    throw new RuntimeException("ELSE IF without matching IF");
                }
                String condition = line.substring(7).trim();
                if (condition.isEmpty()) {
                    throw new RuntimeException("ELSE IF requires a condition");
                }
                int chainIndex = ifStack.peek().addElseIfChain(condition);
                inElseStack.pop();
                inElseStack.push(chainIndex + 1);
                ifStack.peek().setType(BlockType.IF_ELSE);

            } else if (upper.equals("ELSE")) {
                if (frameTypeStack.isEmpty() || !"if".equals(frameTypeStack.peek())) {
                    throw new RuntimeException("ELSE without matching IF");
                }
                inElseStack.pop();
                inElseStack.push(-1);
                ifStack.peek().setType(BlockType.IF_ELSE);

            } else if (upper.equals("END IF")) {
                if (frameTypeStack.isEmpty() || !"if".equals(frameTypeStack.peek())) {
                    throw new RuntimeException("END IF without matching IF");
                }
                frameTypeStack.pop();
                CodeBlock completed = ifStack.pop();
                inElseStack.pop();
                addToCurrentContext(completed, frameTypeStack, ifStack, inElseStack, repeatBodyStack, topLevel);

            } else {
                ActionBlock actionBlock = new ActionBlock(parseAction(line));
                addToCurrentContext(actionBlock, frameTypeStack, ifStack, inElseStack, repeatBodyStack, topLevel);
            }
        }

        if (!frameTypeStack.isEmpty()) {
            if ("if".equals(frameTypeStack.peek())) {
                throw new RuntimeException("Missing END IF for IF block at condition: " + ifStack.peek().getCondition());
            } else {
                throw new RuntimeException("Missing END REPEAT for REPEAT block");
            }
        }

        return new ParsedScript(topLevel);
    }

    private Action parseAction(String line) {
        String normalized = line.replaceAll("([a-z])([A-Z])", "$1_$2").toUpperCase();
        try {
            return Action.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Unknown action: " + line);
        }
    }

    private void addToCurrentContext(
        Object block,
        Deque<String> frameTypeStack,
        Deque<CodeBlock> ifStack,
        Deque<Integer> inElseStack,
        Deque<List<Object>> repeatBodyStack,
        List<Object> topLevel
    ) {
        if (frameTypeStack.isEmpty()) {
            topLevel.add(block);
        } else if ("repeat".equals(frameTypeStack.peek())) {
            repeatBodyStack.peek().add(block);
        } else {
            CodeBlock parent = ifStack.peek();
            int branchState = inElseStack.peek();
            if (branchState == -1) {
                parent.getElseBranch().add(block);
            } else if (branchState == 0) {
                parent.getIfBranch().add(block);
            } else {
                parent.getElseIfChains().get(branchState - 1).getChildren().add(block);
            }
        }
    }
}
