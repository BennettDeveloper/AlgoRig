package com.algorig.algorig_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChangePasswordDto {

    @NotBlank
    private String currentPassword;

    @NotBlank
    @Size(min = 8)
    private String newPassword;
}
