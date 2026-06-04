package com.algorig.algorig_backend.parser;

import java.util.ArrayList;
import java.util.List;

public class CodeBlock {

    public static class ElseIfChain {
        private final String condition;
        private final List<Object> children;

        public ElseIfChain(String condition) {
            this.condition = condition;
            this.children = new ArrayList<>();
        }

        public String getCondition() { return condition; }
        public List<Object> getChildren() { return children; }
    }

    private BlockType type;
    private final String condition;
    private final List<Object> ifBranch;
    private final List<ElseIfChain> elseIfChains;
    private final List<Object> elseBranch;

    public CodeBlock(BlockType type, String condition, List<Object> ifBranch, List<Object> elseBranch) {
        this.type = type;
        this.condition = condition;
        this.ifBranch = ifBranch;
        this.elseIfChains = new ArrayList<>();
        this.elseBranch = elseBranch;
    }

    /** Appends a new ELSE IF chain and returns its 0-based index. */
    public int addElseIfChain(String condition) {
        elseIfChains.add(new ElseIfChain(condition));
        return elseIfChains.size() - 1;
    }

    public BlockType getType() { return type; }
    public void setType(BlockType type) { this.type = type; }
    public String getCondition() { return condition; }
    public List<Object> getIfBranch() { return ifBranch; }
    public List<ElseIfChain> getElseIfChains() { return elseIfChains; }
    public List<Object> getElseBranch() { return elseBranch; }
}
