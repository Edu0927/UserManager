package com.usermanager.backend.config;

import com.usermanager.backend.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jakarta.servlet.http.HttpServletResponse;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http

            .csrf(csrf -> csrf.disable())

            .cors(cors -> cors.configurationSource(
                    corsConfigurationSource()
            ))

            .sessionManagement(session -> session
                    .sessionCreationPolicy(
                            SessionCreationPolicy.STATELESS
                    )
            )

            // Manejo de errores de seguridad

            .exceptionHandling(exception -> exception

                // Usuario no autenticado: 401

                .authenticationEntryPoint(
                    (request, response, authException) -> {

                        response.setStatus(
                            HttpServletResponse.SC_UNAUTHORIZED
                        );

                        response.setContentType(
                            "application/json;charset=UTF-8"
                        );

                        response.getWriter().write(
                            "{\"statusCode\":401," +
                            "\"message\":\"No autenticado\"}"
                        );
                    }
                )

                // Usuario sin permisos: 403

                .accessDeniedHandler(
                    (request, response, accessDeniedException) -> {

                        response.setStatus(
                            HttpServletResponse.SC_FORBIDDEN
                        );

                        response.setContentType(
                            "application/json;charset=UTF-8"
                        );

                        response.getWriter().write(
                            "{\"statusCode\":403," +
                            "\"message\":\"No tienes permisos suficientes\"}"
                        );
                    }
                )
            )

            // Permisos de acceso

            .authorizeHttpRequests(auth -> auth

                .requestMatchers(
                    "/api/auth/login",
                    "/api/health",
                    "/actuator/health"
                ).permitAll()

                .requestMatchers(
                    "/api/users",
                    "/api/users/**",
                    "/actuator/**"
                ).hasRole("ADMIN")

                .anyRequest().authenticated()
            )

            .addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        configuration.setAllowedOrigins(
                List.of("http://localhost:4200")
        );

        configuration.setAllowedMethods(
                List.of(
                    "GET",
                    "POST",
                    "PUT",
                    "DELETE",
                    "PATCH",
                    "OPTIONS"
                )
        );

        configuration.setAllowedHeaders(
                List.of(
                    "Authorization",
                    "Content-Type"
                )
        );

        configuration.setExposedHeaders(
                List.of("X-Request-ID")
        );

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );

        return source;
    }
}
