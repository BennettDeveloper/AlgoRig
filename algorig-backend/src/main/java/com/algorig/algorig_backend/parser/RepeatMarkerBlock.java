package com.algorig.algorig_backend.parser;

public class RepeatMarkerBlock {

    private final String markerType; // "START", "LOOP", or "END"
    private final int iteration;     // current iteration (1-indexed)
    private final int total;         // total iterations for this REPEAT

    public RepeatMarkerBlock(String markerType, int iteration, int total) {
        this.markerType = markerType;
        this.iteration = iteration;
        this.total = total;
    }

    public String getMarkerType() { return markerType; }
    public int getIteration()     { return iteration; }
    public int getTotal()         { return total; }
}
