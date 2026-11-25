package com.usermanager.backend.dto;

public record LoginResponse(
    String token,
    String tokenType,
    Long id,
    String name,
    String email,
    String role
) {}
