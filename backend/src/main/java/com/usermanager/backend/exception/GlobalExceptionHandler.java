package com.usermanager.backend.exception;

import lombok.extern.slf4j.Slf4j;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.dao.DataIntegrityViolationException;

import jakarta.servlet.http.HttpServletRequest;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(
            MethodArgumentNotValidException ex,
            HttpServletRequest request
    ) {

        Map<String, String> errors = new LinkedHashMap<>();

        ex.getBindingResult().getFieldErrors()
                .forEach(error ->
                    errors.put(
                        error.getField(),
                        error.getDefaultMessage()
                    )
                );

        Map<String, Object> body = buildResponse(
            400, "Validation failed", request
        );

        body.put("errors", errors);

        log.warn(
            "action=VALIDATION_FAILED endpoint={} statusCode=400",
            request.getRequestURI()
        );

        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleStatus(
            ResponseStatusException ex,
            HttpServletRequest request
    ) {

        int status = ex.getStatusCode().value();

        log.warn(
            "action=REQUEST_FAILED endpoint={} statusCode={}",
            request.getRequestURI(),
            status
        );

        return ResponseEntity.status(status).body(
            buildResponse(status, ex.getReason(), request)
        );
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidJson(
            HttpMessageNotReadableException ex,
            HttpServletRequest request
    ) {

        log.warn(
            "action=INVALID_JSON endpoint={} statusCode=400",
            request.getRequestURI()
        );

        return ResponseEntity.badRequest().body(
            buildResponse(400, "Invalid request body", request)
        );
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConflict(
            DataIntegrityViolationException ex,
            HttpServletRequest request
    ) {

        log.warn(
            "action=DATABASE_CONFLICT endpoint={} statusCode=409",
            request.getRequestURI()
        );

        return ResponseEntity.status(409).body(
            buildResponse(409, "Database conflict", request)
        );
    }

    private Map<String, Object> buildResponse(
            int status,
            String message,
            HttpServletRequest request
    ) {

        Map<String, Object> body = new LinkedHashMap<>();

        body.put("timestamp", Instant.now().toString());
        body.put("statusCode", status);
        body.put("message", message);
        body.put("endpoint", request.getRequestURI());

        return body;
    }
}
