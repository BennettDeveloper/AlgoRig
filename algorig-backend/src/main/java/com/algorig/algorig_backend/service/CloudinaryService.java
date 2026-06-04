package com.algorig.algorig_backend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public String uploadAvatar(Long userId, byte[] fileBytes) {
        try {
            Map<?, ?> result = cloudinary.uploader().upload(fileBytes, ObjectUtils.asMap(
                    "folder",        "algorig/avatars",
                    "public_id",     "user_" + userId,
                    "overwrite",     true,
                    "resource_type", "image"
            ));
            return (String) result.get("secure_url");
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Avatar upload failed");
        }
    }
}
