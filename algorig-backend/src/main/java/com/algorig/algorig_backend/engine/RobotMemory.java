package com.algorig.algorig_backend.engine;

import java.util.HashMap;
import java.util.Map;

public class RobotMemory {

    private final Map<String, Integer> variables = new HashMap<>();

    public void set(String name, int value)  { variables.put(name, value); }
    public int  get(String name)             { return variables.getOrDefault(name, 0); }
    public boolean has(String name)          { return variables.containsKey(name); }
    public Map<String, Integer> getAll()     { return new HashMap<>(variables); }
    public void clear()                      { variables.clear(); }
}
