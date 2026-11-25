package com.usermanager.backend.service;

import com.usermanager.backend.dto.*;
import com.usermanager.backend.entity.User;
import com.usermanager.backend.entity.Role;
import com.usermanager.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // CREAR USUARIO
    public UserResponse create(UserRequest request) {

        String email = request.email()
                .trim().toLowerCase(Locale.ROOT);

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "El correo electrónico ya está registrado"
            );
        }

        if (userRepository.existsByPhone(request.phone())) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "El número de teléfono ya está registrado"
            );
        }

        User user = new User();

        user.setName(request.name().trim());
        user.setEmail(email);
        user.setPhone(request.phone());

        user.setPassword(
            passwordEncoder.encode(request.password())
        );

        user.setRole(request.role());
        user.setActive(true);

        User saved = userRepository.saveAndFlush(user);

        log.info(
            "action=USER_CREATED userId={}",
            saved.getId()
        );

        return toResponse(saved);
    }

    // OBTENER TODOS LOS USUARIOS
    @Transactional(readOnly = true)
    public List<UserResponse> findAll() {

        List<UserResponse> users = userRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();

        log.info(
            "action=USERS_LISTED total={}",
            users.size()
        );

        return users;
    }

    // OBTENER USUARIO POR ID
    @Transactional(readOnly = true)
    public UserResponse findById(Long id) {

        User user = getUser(id);

        log.info("action=USER_FOUND userId={}", id);

        return toResponse(user);
    }

    // ACTUALIZAR USUARIO
    public UserResponse update(
            Long id,
            UserUpdateRequest request,
            String authenticatedEmail
    ) {

        User user = getUser(id);

        String email = request.email()
                .trim().toLowerCase(Locale.ROOT);

        if (userRepository
                .existsByEmailIgnoreCaseAndIdNot(email, id)) {

            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "El correo electrónico ya está registrado"
            );
        }

        if (userRepository
                .existsByPhoneAndIdNot(request.phone(), id)) {

            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "El número de teléfono ya está registrado"
            );
        }

        if (user.getEmail().equalsIgnoreCase(authenticatedEmail)
                && request.role() != Role.ADMIN) {

            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "No puedes quitarte tu propio rol de administrador"
            );
        }

        user.setName(request.name().trim());
        user.setEmail(email);
        user.setPhone(request.phone());
        user.setRole(request.role());

        if (request.password() != null) {

            user.setPassword(
                passwordEncoder.encode(request.password())
            );
        }

        User updated = userRepository.saveAndFlush(user);

        log.info("action=USER_UPDATED userId={}", id);

        return toResponse(updated);
    }

    // ELIMINAR USUARIO
    public void delete(Long id, String authenticatedEmail) {

        User user = getUser(id);

        if (user.getEmail().equalsIgnoreCase(authenticatedEmail)) {

            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "No puedes eliminar tu propia cuenta"
            );
        }

        userRepository.delete(user);
        userRepository.flush();

        log.info("action=USER_DELETED userId={}", id);
    }

    // ACTUALIZAR ESTADO DEL USUARIO
    public UserResponse updateStatus(
            Long id,
            boolean active,
            String authenticatedEmail
    ) {

        User user = getUser(id);

        if (!active &&
            user.getEmail().equalsIgnoreCase(authenticatedEmail)) {

            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "No puedes desactivar tu propia cuenta"
            );
        }

        user.setActive(active);

        User updated = userRepository.saveAndFlush(user);

        log.info(
            "action=USER_STATUS_UPDATED userId={} active={}",
            id,
            active
        );

        return toResponse(updated);
    }

    // BUSCAR USUARIO
    private User getUser(Long id) {

        return userRepository.findById(id)
                .orElseThrow(() ->
                    new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Usuario no encontrado"
                    )
                );
    }

    // CONVERTIR ENTIDAD A DTO
    private UserResponse toResponse(User user) {

        return new UserResponse(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getPhone(),
            user.getRole(),
            user.isActive(),
            user.getCreatedAt(),
            user.getUpdatedAt()
        );
    }
}