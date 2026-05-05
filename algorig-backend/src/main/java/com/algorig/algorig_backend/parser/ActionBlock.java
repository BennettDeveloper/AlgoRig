package com.algorig.algorig_backend.parser;

import com.algorig.algorig_backend.engine.Action;

public class ActionBlock {

    private final Action action;

    public ActionBlock(Action action) {
        this.action = action;
    }

    public Action getAction() {
        return action;
    }
}