package com.usermanager.backend.dto;

import jakarta.validation.constraints.*;
import com.usermanager.backend.entity.Role;

public record UserRequest(

    @NotBlank(message = "El nombre es obligatorio")
    @Size(min = 2, max = 50,
          message = "El nombre debe tener entre 2 y 50 caracteres")
    String name,

    @NotBlank(message = "El correo electrónico es obligatorio")
    @Email(message = "El formato del correo electrónico no es válido")
    @Size(max = 50,
          message = "El correo electrónico no debe superar los 50 caracteres")
    String email,

    @NotBlank(message = "El teléfono es obligatorio")
    @Pattern(regexp = "^[0-9]{10}$",
             message = "El teléfono debe contener exactamente 10 dígitos")
    String phone,

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 8, max = 8,
          message = "La contraseña debe contener exactamente 8 caracteres")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9\\s])\\S{8}$",
        message = "La contraseña debe incluir al menos una letra mayúscula, una minúscula, un número y un carácter especial"
    )
    String password,

    @NotNull(message = "El rol es obligatorio")
    Role role

) {}