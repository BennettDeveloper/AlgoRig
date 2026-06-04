package com.algorig.algorig_backend.dto;

import jakarta.validation.constraints.NotBlank;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class LoginRequestDto {

    @NotBlank
    private String email;

    @NotBlank
    private String password;
}
