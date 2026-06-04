package com.algorig.algorig_backend.dto;

import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateProfileDto {

    @Size(min = 3, max = 30)
    private String username;

    @Size(max = 160)
    private String tagline;
}
