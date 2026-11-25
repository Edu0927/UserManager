package com.usermanager.backend.dto;

import jakarta.validation.constraints.*;

public record LoginRequest(

    @NotBlank(message = "El correo electrónico es obligatorio")
    @Email(message = "El formato del correo electrónico no es válido")
    @Size(max = 50, message = "El correo electrónico no debe superar los 50 caracteres")
    String email,

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 8, max = 8, message = "La contraseña debe contener exactamente 8 caracteres")
    String password

) {}