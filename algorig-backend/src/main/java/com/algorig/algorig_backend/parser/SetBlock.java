package com.algorig.algorig_backend.parser;

public class SetBlock {

    private final String variableName;
    private final String expression;

    public SetBlock(String variableName, String expression) {
        this.variableName = variableName;
        this.expression = expression;
    }

    public String getVariableName() { return variableName; }
    public String getExpression()   { return expression; }
}
