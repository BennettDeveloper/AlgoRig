package com.algorig.algorig_backend.security;

import com.algorig.algorig_backend.model.entity.User;
import com.algorig.algorig_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class OAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest request) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(request);
        Map<String, Object> attributes = oAuth2User.getAttributes();

        String provider = request.getClientRegistration().getRegistrationId();
        String email;
        String providerId;
        String avatarUrl;

        if ("google".equals(provider)) {
            email = (String) attributes.get("email");
            providerId = (String) attributes.get("sub");
            avatarUrl = (String) attributes.get("picture");
        } else {
            // github
            Object rawEmail = attributes.get("email");
            providerId = String.valueOf(attributes.get("id"));
            avatarUrl = (String) attributes.get("avatar_url");
            // GitHub may not expose email if the user has set it private
            if (rawEmail == null || rawEmail.toString().isBlank()) {
                email = "github_" + providerId + "@placeholder.algorig.local";
            } else {
                email = rawEmail.toString();
            }
        }

        Optional<User> existing = userRepository.findByProviderAndProviderId(provider, providerId);
        User user;
        if (existing.isPresent()) {
            user = existing.get();
            user.setEmail(email);
            user.setAvatarUrl(avatarUrl);
            user = userRepository.save(user);
        } else {
            String username = generateUniqueUsername(email);
            user = User.builder()
                    .provider(provider)
                    .providerId(providerId)
                    .email(email)
                    .avatarUrl(avatarUrl)
                    .username(username)
                    .build();
            user = userRepository.save(user);
        }

        return new CustomOAuth2User(user, oAuth2User);
    }

    private String generateUniqueUsername(String email) {
        String base = email.split("@")[0].replaceAll("[^a-zA-Z0-9_]", "_");
        String candidate = base;
        int counter = 1;
        while (userRepository.existsByUsername(candidate)) {
            candidate = base + counter++;
        }
        return candidate;
    }
}
