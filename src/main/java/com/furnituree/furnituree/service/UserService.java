package com.furnituree.furnituree.service;

import java.util.Locale;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.furnituree.furnituree.dto.ChangePasswordRequest;
import com.furnituree.furnituree.dto.ChangeRoleRequest;
import com.furnituree.furnituree.dto.UpdateProfileRequest;
import com.furnituree.furnituree.exception.BusinessException;
import com.furnituree.furnituree.exception.ResourceNotFoundException;
import com.furnituree.furnituree.model.User;
import com.furnituree.furnituree.repo.user_repo;

@Service
public class UserService {
    private final user_repo userRepository;
    private final BCryptPasswordEncoder encoder;
    private final AuditService auditService;

    public UserService(user_repo userRepository, BCryptPasswordEncoder encoder, AuditService auditService) {
        this.userRepository = userRepository;
        this.encoder = encoder;
        this.auditService = auditService;
    }

    public User findByUsernameOrThrow(String username) {
        User user = userRepository.findByUsername(username);
        if (user == null) {
            throw new ResourceNotFoundException("User not found: " + username);
        }
        return user;
    }

    @Transactional
    public User register(User input) {
        String username = input.getUsername() == null ? null : input.getUsername().trim();
        String email = input.getEmail() == null ? null : input.getEmail().trim();
        input.setUsername(username);
        input.setEmail(email == null || email.isBlank() ? null : email);

        if (username == null || username.isBlank()) {
            throw new BusinessException("Username is required");
        }
        if (input.getPassword() == null || input.getPassword().length() < 8) {
            throw new BusinessException("Password must be at least 8 characters");
        }
        if (userRepository.existsByUsername(username)) {
            throw new BusinessException("Username already exists");
        }
        if (input.getEmail() != null && userRepository.existsByEmail(input.getEmail())) {
            throw new BusinessException("Email already exists");
        }
        String role = normalizeRole(input.getRole());
        if (!role.equals("CUSTOMER") && !role.equals("MANAGER") && !role.equals("ADMIN")) {
            role = "CUSTOMER";
        }
        input.setRole(role);
        input.setPassword(encoder.encode(input.getPassword()));
        input.setActive(true);
        User saved = userRepository.save(input);
        auditService.record("CREATE", "User", saved.getUser_Id(), "New user registered");
        return saved;
    }

    @Transactional
    public User updateProfile(String username, UpdateProfileRequest request) {
        User user = findByUsernameOrThrow(username);
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhonenumber(request.getPhonenumber());
        user.setAddress(request.getAddress());
        auditService.record("UPDATE", "User", user.getUser_Id(), "Profile updated");
        return userRepository.save(user);
    }

    @Transactional
    public void changePassword(String username, ChangePasswordRequest request) {
        User user = findByUsernameOrThrow(username);
        if (!encoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BusinessException("Current password is incorrect");
        }
        user.setPassword(encoder.encode(request.getNewPassword()));
        userRepository.save(user);
        auditService.record("CHANGE_PASSWORD", "User", user.getUser_Id(), "Password changed");
    }

    @Transactional
    public User changeRole(Long id, ChangeRoleRequest request) {
        User user = userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        String role = normalizeRole(request.getRole());
        if (!role.equals("CUSTOMER") && !role.equals("MANAGER") && !role.equals("ADMIN")) {
            throw new BusinessException("Role must be ADMIN, MANAGER, or CUSTOMER");
        }
        user.setRole(role);
        auditService.record("CHANGE_ROLE", "User", user.getUser_Id(), "Role changed to " + role);
        return userRepository.save(user);
    }

    @Transactional
    public User setActive(Long id, boolean active) {
        User user = userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setActive(active);
        auditService.record(active ? "ACTIVATE" : "DEACTIVATE", "User", user.getUser_Id(), "Admin changed active status");
        return userRepository.save(user);
    }

    private String normalizeRole(String role) {
        if (role == null || role.isBlank()) {
            return "CUSTOMER";
        }
        return role.replace("ROLE_", "").toUpperCase(Locale.ROOT).trim();
    }
}
