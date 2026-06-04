package com.algorig.algorig_backend.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UserDto {

    private Long id;
    private String username;
    private String email;
    private String avatarUrl;
    private String tagline;
    private LocalDateTime createdAt;
}
