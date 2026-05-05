package com.algorig.algorig_backend;

import org.springframework.boot.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.boot.SpringApplication;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

public class DotenvEnvironmentPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Path dotenv = Path.of(".env");
        if (!Files.exists(dotenv)) return;

        Map<String, Object> props = new HashMap<>();
        try {
            for (String line : Files.readAllLines(dotenv)) {
                line = line.strip();
                if (line.isEmpty() || line.startsWith("#")) continue;
                int eq = line.indexOf('=');
                if (eq < 1) continue;
                props.put(line.substring(0, eq).strip(), line.substring(eq + 1).strip());
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to load .env file", e);
        }

        environment.getPropertySources().addLast(new MapPropertySource("dotenv", props));
    }
}
