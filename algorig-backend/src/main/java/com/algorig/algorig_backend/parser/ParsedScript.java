package com.algorig.algorig_backend.parser;

import java.util.List;

public class ParsedScript {

    private final List<Object> blocks;

    public ParsedScript(List<Object> blocks) {
        this.blocks = blocks;
    }

    public List<Object> getBlocks() {
        return blocks;
    }
}