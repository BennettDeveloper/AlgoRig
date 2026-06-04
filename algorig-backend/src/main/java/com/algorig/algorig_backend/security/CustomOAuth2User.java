package com.algorig.algorig_backend.security;

import com.algorig.algorig_backend.model.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.Map;

public class CustomOAuth2User implements OAuth2User {

    private final User user;
    private final OAuth2User delegate;

    public CustomOAuth2User(User user, OAuth2User delegate) {
        this.user = user;
        this.delegate = delegate;
    }

    public User getUser() {
        return user;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return delegate.getAuthorities();
    }

    @Override
    public Map<String, Object> getAttributes() {
        return delegate.getAttributes();
    }

    @Override
    public String getName() {
        return user.getId().toString();
    }
}
