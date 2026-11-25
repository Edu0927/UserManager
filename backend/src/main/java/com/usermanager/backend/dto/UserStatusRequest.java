package com.usermanager.backend.dto;

import jakarta.validation.constraints.NotNull;

public record UserStatusRequest(

    @NotNull(message = "El estado activo es obligatorio")
    Boolean active

) {}