package com.algorig.algorig_backend.parser;

import java.util.List;

public class CodeBlock {

    private BlockType type;
    private final String condition;
    private final List<Object> ifBranch;
    private final List<Object> elseBranch;

    public CodeBlock(BlockType type, String condition, List<Object> ifBranch, List<Object> elseBranch) {
        this.type = type;
        this.condition = condition;
        this.ifBranch = ifBranch;
        this.elseBranch = elseBranch;
    }

    public BlockType getType() { return type; }
    public void setType(BlockType type) { this.type = type; }
    public String getCondition() { return condition; }
    public List<Object> getIfBranch() { return ifBranch; }
    public List<Object> getElseBranch() { return elseBranch; }
}