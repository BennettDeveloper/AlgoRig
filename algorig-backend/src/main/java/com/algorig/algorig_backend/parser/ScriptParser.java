package com.algorig.algorig_backend.parser;

import com.algorig.algorig_backend.engine.Action;
import org.springframework.stereotype.Component;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

@Component
public class ScriptParser {

    public ParsedScript parse(String scriptContent) {
        String[] lines = scriptContent.split("\n");

        Deque<CodeBlock> stack = new ArrayDeque<>();
        Deque<Boolean> inElseStack = new ArrayDeque<>();
        List<Object> topLevel = new ArrayList<>();

        for (String rawLine : lines) {
            String line = rawLine.trim();
            if (line.isEmpty()) continue;

            if (line.startsWith("IF ")) {
                String condition = line.substring(3).trim();
                CodeBlock block = new CodeBlock(BlockType.IF, condition, new ArrayList<>(), new ArrayList<>());
                stack.push(block);
                inElseStack.push(false);
            } else if (line.equals("ELSE")) {
                if (stack.isEmpty()) {
                    throw new RuntimeException("ELSE without matching IF");
                }
                inElseStack.pop();
                inElseStack.push(true);
                stack.peek().setType(BlockType.IF_ELSE);
            } else if (line.equals("END IF")) {
                if (stack.isEmpty()) {
                    throw new RuntimeException("END IF without matching IF");
                }
                CodeBlock completed = stack.pop();
                inElseStack.pop();
                addToCurrentContext(completed, stack, inElseStack, topLevel);
            } else {
                ActionBlock actionBlock = new ActionBlock(parseAction(line));
                addToCurrentContext(actionBlock, stack, inElseStack, topLevel);
            }
        }

        if (!stack.isEmpty()) {
            throw new RuntimeException("Missing END IF for IF block at condition: " + stack.peek().getCondition());
        }

        return new ParsedScript(topLevel);
    }

    private Action parseAction(String line) {
        // Convert camelCase (e.g. "HardStrike") to UPPER_SNAKE_CASE (e.g. "HARD_STRIKE")
        String normalized = line.replaceAll("([a-z])([A-Z])", "$1_$2").toUpperCase();
        try {
            return Action.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Unknown action: " + line);
        }
    }

    private void addToCurrentContext(Object block, Deque<CodeBlock> stack, Deque<Boolean> inElseStack, List<Object> topLevel) {
        if (stack.isEmpty()) {
            topLevel.add(block);
        } else {
            CodeBlock parent = stack.peek();
            if (Boolean.TRUE.equals(inElseStack.peek())) {
                parent.getElseBranch().add(block);
            } else {
                parent.getIfBranch().add(block);
            }
        }
    }
}