package com.usermanager.backend.service;

import com.usermanager.backend.dto.LoginRequest;
import com.usermanager.backend.dto.LoginResponse;
import com.usermanager.backend.entity.User;
import com.usermanager.backend.repository.UserRepository;
import com.usermanager.backend.security.JwtService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public LoginResponse login(LoginRequest request) {

        User user = userRepository
                .findByEmailIgnoreCase(request.email().trim())
                .orElse(null);

        if (user == null ||
                !passwordEncoder.matches(
                        request.password(),
                        user.getPassword()
                ) ||
                !user.isActive()) {

            log.warn(
                "action=LOGIN_FAILED reason=INVALID_CREDENTIALS"
            );

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid credentials"
            );
        }

        String token = jwtService.generateToken(
                user.getEmail(),
                user.getRole().name()
        );

        log.info(
                "action=LOGIN_SUCCESS userId={} role={}",
                user.getId(),
                user.getRole()
        );

        return new LoginResponse(
                token,
                "Bearer",
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name()
        );
    }
}

