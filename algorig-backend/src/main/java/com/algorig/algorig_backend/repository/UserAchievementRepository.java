package com.algorig.algorig_backend.repository;

import com.algorig.algorig_backend.model.entity.User;
import com.algorig.algorig_backend.model.entity.UserAchievement;
import com.algorig.algorig_backend.model.enums.AchievementType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserAchievementRepository extends JpaRepository<UserAchievement, Long> {

    List<UserAchievement> findByUser(User user);

    List<UserAchievement> findByUserOrderByAwardedAtDesc(User user);

    boolean existsByUserAndAchievementType(User user, AchievementType type);

    int countByUser(User user);
}
