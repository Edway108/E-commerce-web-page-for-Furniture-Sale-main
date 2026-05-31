package com.furnituree.furnituree.Controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.furnituree.furnituree.config.JwtUtil;
import com.furnituree.furnituree.dto.AuthResponse;
import com.furnituree.furnituree.exception.BusinessException;
import com.furnituree.furnituree.model.User;
import com.furnituree.furnituree.repo.user_repo;
import com.furnituree.furnituree.service.UserService;

@RestController
@RequestMapping({ "/auth", "/api/v1/auth" })
public class AuthController {
    private final user_repo uRepo;
    private final BCryptPasswordEncoder encoder;
    private final UserService userService;

    public AuthController(user_repo uRepo, BCryptPasswordEncoder encoder, UserService userService) {
        this.uRepo = uRepo;
        this.encoder = encoder;
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody Map<String, Object> request) {
        User user = new User();
        user.setUsername(asText(request.get("username")));
        user.setPassword(asText(request.get("password")));
        user.setFullName(asText(request.get("fullName")));
        user.setEmail(asText(request.get("email")));
        user.setAddress(asText(request.get("address")));
        user.setPhonenumber(asInt(request.get("phonenumber")));

        User saved = userService.register(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Username successfully registered",
                "userId", saved.getUser_Id(),
                "username", saved.getUsername(),
                "role", saved.getRole()));
    }

    // Define if the code is null or not if it have text then just give it back and
    // delete the white space
    private String asText(Object value) {
        if (value == null)
            return null;
        String text = String.valueOf(value).trim();
        return text.isBlank() ? null : text;
    }

    // define if it is a number or not
    private int asInt(Object value) {
        if (value == null || String.valueOf(value).isBlank())
            return 0;
        try {
            return Integer.parseInt(String.valueOf(value).trim());
        } catch (NumberFormatException ex) {
            return 0;
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody Map<String, Object> request) {
        String username = asText(request.get("username"));
        String password = asText(request.get("password"));
        if (username == null || password == null) {
            throw new BusinessException("Username and password are required");
        }

        User dbUser = uRepo.findByUsername(username);
        if (dbUser == null || !dbUser.isActive() || !dbUser.isAccountNonLocked()) {
            throw new BusinessException("Invalid username or inactive account");
        }

        if (!passwordMatches(password, dbUser.getPassword())) {
            throw new BusinessException("Password is wrong");
        }

        // Generate the token then response back
        String token = JwtUtil.generateToken(dbUser.getUsername(), dbUser.getRole());
        return ResponseEntity.ok(new AuthResponse(token, dbUser.getUser_Id(), dbUser.getUsername(), dbUser.getRole()));
    }

    private boolean passwordMatches(String raw, String stored) {
        if (stored == null)
            return false;
        try {
            if (stored.startsWith("$2")) {
                return encoder.matches(raw, stored);// automatically hash raw then send back to compare
            }
        } catch (IllegalArgumentException ignored) {
        }
        return raw.equals(stored);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok(Map.of("message", "Logout successful."));
    }
}
