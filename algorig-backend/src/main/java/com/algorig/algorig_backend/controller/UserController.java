package com.algorig.algorig_backend.controller;

import com.algorig.algorig_backend.dto.*;
import com.algorig.algorig_backend.model.entity.User;
import com.algorig.algorig_backend.service.AchievementService;
import com.algorig.algorig_backend.service.UserService;
import com.algorig.algorig_backend.util.AuthUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final AchievementService achievementService;

    @GetMapping("/{username}")
    public PublicProfileDto getPublicProfile(@PathVariable String username) {
        return userService.getPublicProfile(username);
    }

    @PutMapping("/me")
    public UserDto updateProfile(@RequestBody @Valid UpdateProfileDto dto) {
        User user = AuthUtil.getCurrentUser();
        return userService.updateProfile(user, dto);
    }

    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadAvatar(
            @RequestParam("file") MultipartFile file) {
        User user = AuthUtil.getCurrentUser();
        UserDto updated = userService.uploadAvatar(user, file);
        String avatarUrl = updated.getAvatarUrl() != null ? updated.getAvatarUrl() : "";
        return ResponseEntity.ok(Map.of("avatarUrl", avatarUrl));
    }

    @PutMapping("/me/password")
    public ResponseEntity<Void> changePassword(@RequestBody @Valid ChangePasswordDto dto) {
        User user = AuthUtil.getCurrentUser();
        userService.changePassword(user, dto);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me/achievements")
    public List<UserAchievementDto> getMyAchievements() {
        User user = AuthUtil.getCurrentUser();
        return achievementService.getAchievementsForUser(user);
    }
}
