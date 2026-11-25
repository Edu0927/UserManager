package com.usermanager.backend.dto;

import com.usermanager.backend.entity.Role;
import java.time.LocalDateTime;

public record UserResponse(
    Long id,
    String name,
    String email,
    String phone,
    Role role,
    boolean active,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
