package com.algorig.algorig_backend.engine;

import java.util.HashMap;
import java.util.Map;

public class PassiveState {
    private final Map<String, Object> state = new HashMap<>();

    public void set(String key, Object value) {
        state.put(key, value);
    }

    public Object get(String key) {
        return state.get(key);
    }

    public int getInt(String key) {
        Object val = state.get(key);
        return val instanceof Integer ? (Integer) val : 0;
    }

    public boolean getBoolean(String key) {
        Object val = state.get(key);
        return val instanceof Boolean ? (Boolean) val : false;
    }

    public void increment(String key, int amount) {
        state.put(key, getInt(key) + amount);
    }

    public void reset() {
        state.clear();
    }

    public boolean has(String key) {
        return state.containsKey(key);
    }
}
