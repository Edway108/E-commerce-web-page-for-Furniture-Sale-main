package com.furnituree.furnituree.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.furnituree.furnituree.exception.BusinessException;

@Service
public class FileStorageService {
    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/webp", "image/gif");

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    public String storeProductImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Image file is required");
        }
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new BusinessException("Only JPG, PNG, WEBP, and GIF images are allowed");
        }
        try {
            Path dir = Paths.get(uploadDir, "products");
            Files.createDirectories(dir);
            String original = file.getOriginalFilename() == null ? "image" : file.getOriginalFilename().replaceAll("[^a-zA-Z0-9._-]", "_");
            String filename = UUID.randomUUID() + "-" + original;
            Path target = dir.resolve(filename);
            Files.copy(file.getInputStream(), target);
            return "/uploads/products/" + filename;
        } catch (IOException e) {
            throw new BusinessException("Could not save uploaded file");
        }
    }
}
