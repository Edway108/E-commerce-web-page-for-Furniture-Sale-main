package com.furnituree.furnituree.Controller;

import java.util.List;
import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.furnituree.furnituree.dto.ChangePasswordRequest;
import com.furnituree.furnituree.dto.ChangeRoleRequest;
import com.furnituree.furnituree.dto.UpdateProfileRequest;
import com.furnituree.furnituree.model.User;
import com.furnituree.furnituree.exception.ResourceNotFoundException;
import com.furnituree.furnituree.repo.user_repo;
import com.furnituree.furnituree.service.UserService;
import com.furnituree.furnituree.util.SecurityUtil;

import jakarta.validation.Valid;

@RestController
@RequestMapping({"/users", "/api/v1/users"})
public class user_controller {
    private final user_repo repo;
    private final UserService userService;

    public user_controller(user_repo repo, UserService userService) {
        this.repo = repo;
        this.userService = userService;
    }

    @GetMapping({"/findall", ""})
    @PreAuthorize("hasRole('ADMIN')")
    public List<User> getAllUser() {
        return repo.findAll();
    }

    @GetMapping("/profile")
    public User profile() {
        return userService.findByUsernameOrThrow(SecurityUtil.currentUsername());
    }

    @PutMapping("/profile")
    public User updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return userService.updateProfile(SecurityUtil.currentUsername(), request);
    }

    @PutMapping("/change-password")
    public Map<String, String> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(SecurityUtil.currentUsername(), request);
        return Map.of("message", "Password changed successfully");
    }

    @PostMapping("/addUser")
    @PreAuthorize("hasRole('ADMIN')")
    public User createUser(@RequestBody User user) {
        return userService.register(user);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, String> deactivateUser(@PathVariable Long id) {
        userService.setActive(id, false);
        return Map.of("message", "User deactivated");
    }

    @PutMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public User activateUser(@PathVariable Long id) {
        return userService.setActive(id, true);
    }

    @PutMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public User changeRole(@PathVariable Long id, @Valid @RequestBody ChangeRoleRequest request) {
        return userService.changeRole(id, request);
    }

    @PutMapping("update/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public User updateUser(@PathVariable Long id, @RequestBody User u) {
        User old = repo.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        old.setUsername(u.getUsername());
        old.setAddress(u.getAddress());
        old.setPhonenumber(u.getPhonenumber());
        old.setFullName(u.getFullName());
        old.setEmail(u.getEmail());
        return repo.save(old);
    }
}
