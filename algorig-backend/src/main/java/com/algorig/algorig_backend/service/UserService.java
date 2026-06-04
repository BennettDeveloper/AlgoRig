package com.algorig.algorig_backend.service;

import com.algorig.algorig_backend.dto.*;
import com.algorig.algorig_backend.model.entity.User;
import com.algorig.algorig_backend.repository.ScriptRepository;
import com.algorig.algorig_backend.repository.UserRepository;
import com.algorig.algorig_backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder passwordEncoder;
    private final UserStatsService userStatsService;
    private final AchievementService achievementService;
    private final ScriptRepository scriptRepository;
    private final CloudinaryService cloudinaryService;

    public AuthResponseDto register(RegisterRequestDto dto) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
        }
        if (userRepository.existsByUsername(dto.getUsername())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken");
        }

        User user = User.builder()
                .username(dto.getUsername())
                .email(dto.getEmail())
                .passwordHash(passwordEncoder.encode(dto.getPassword()))
                .provider("local")
                .build();

        user = userRepository.save(user);
        String token = jwtUtil.generateToken(user);
        return toAuthResponse(user, token);
    }

    public AuthResponseDto login(LoginRequestDto dto) {
        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        if (user.getPasswordHash() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "This account uses Google/GitHub login");
        }

        if (!passwordEncoder.matches(dto.getPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        String token = jwtUtil.generateToken(user);
        return toAuthResponse(user, token);
    }

    public UserDto getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return toUserDto(user);
    }

    @Transactional(readOnly = true)
    public PublicProfileDto getPublicProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        UserStatsDto stats = userStatsService.getStatsDtoForUser(user);
        List<UserAchievementDto> achievements = achievementService.getAchievementsForUser(user);

        List<FeaturedScriptDto> featuredScripts = scriptRepository
                .findByOwnerAndFeaturedOrderIsNotNullOrderByFeaturedOrderAsc(user)
                .stream()
                .map(s -> FeaturedScriptDto.builder()
                        .id(s.getId())
                        .name(s.getName())
                        .content(s.getContent())
                        .featuredOrder(s.getFeaturedOrder())
                        .updatedAt(s.getUpdatedAt())
                        .build())
                .toList();

        return PublicProfileDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .tagline(user.getTagline())
                .provider(user.getProvider())
                .createdAt(user.getCreatedAt())
                .stats(stats)
                .achievements(achievements)
                .featuredScripts(featuredScripts)
                .build();
    }

    @Transactional
    public UserDto updateProfile(User user, UpdateProfileDto dto) {
        if (dto.getUsername() != null && !dto.getUsername().equals(user.getUsername())) {
            if (userRepository.existsByUsername(dto.getUsername())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken");
            }
            user.setUsername(dto.getUsername());
        }
        if (dto.getTagline() != null) {
            user.setTagline(dto.getTagline());
        }
        user = userRepository.save(user);
        return toUserDto(user);
    }

    @Transactional
    public void changePassword(User user, ChangePasswordDto dto) {
        // Re-fetch within this transaction so we operate on a managed entity,
        // not the detached principal from JwtAuthFilter's earlier session.
        User freshUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (freshUser.getPasswordHash() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "OAuth accounts cannot change password");
        }
        if (!passwordEncoder.matches(dto.getCurrentPassword(), freshUser.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Current password is incorrect");
        }
        freshUser.setPasswordHash(passwordEncoder.encode(dto.getNewPassword()));
        userRepository.save(freshUser);
    }

    @Transactional
    public UserDto uploadAvatar(User user, MultipartFile file) {
        try {
            String avatarUrl = cloudinaryService.uploadAvatar(user.getId(), file.getBytes());
            user.setAvatarUrl(avatarUrl);
            user = userRepository.save(user);
            return toUserDto(user);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to read uploaded file");
        }
    }

    private AuthResponseDto toAuthResponse(User user, String token) {
        return AuthResponseDto.builder()
                .token(token)
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }

    private UserDto toUserDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .tagline(user.getTagline())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
