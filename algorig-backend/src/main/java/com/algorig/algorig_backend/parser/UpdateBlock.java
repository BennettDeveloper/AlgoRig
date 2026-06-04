package com.algorig.algorig_backend.parser;

public class UpdateBlock {
    private final String variableName;
    private final String operator;   // "+=", "-=", "*=", "/=", "%="
    private final String expression; // number literal or variable name

    public UpdateBlock(String variableName, String operator, String expression) {
        this.variableName = variableName;
        this.operator = operator;
        this.expression = expression;
    }

    public String getVariableName() { return variableName; }
    public String getOperator()     { return operator; }
    public String getExpression()   { return expression; }
}
