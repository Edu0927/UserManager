package com.usermanager.backend.config;

import com.usermanager.backend.entity.User;
import com.usermanager.backend.entity.Role;
import com.usermanager.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Value("${app.admin.password}")
    private String adminPassword;

    @Override
    public void run(String... args) {

        if (userRepository
                .findByEmailIgnoreCase(adminEmail)
                .isEmpty()) {

            User admin = new User();

            admin.setName("Administrator");
            admin.setEmail(adminEmail);
            admin.setPhone("4428986870");

            admin.setPassword(
                    passwordEncoder.encode(adminPassword)
            );

            admin.setRole(Role.ADMIN);
            admin.setActive(true);

            userRepository.save(admin);

            log.info("action=DEFAULT_ADMIN_CREATED");

        } else {

            log.info("action=DEFAULT_ADMIN_ALREADY_EXISTS");
        }
    }
}
