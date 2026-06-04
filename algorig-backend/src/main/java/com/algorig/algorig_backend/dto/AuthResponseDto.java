package com.algorig.algorig_backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponseDto {

    private String token;
    @Builder.Default
    private String tokenType = "Bearer";
    private Long userId;
    private String username;
    private String email;
    private String avatarUrl;
}
