package com.usermanager.backend.monitoring;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import lombok.extern.slf4j.Slf4j;

import org.slf4j.MDC;
import org.slf4j.spi.LoggingEventBuilder;
import org.springframework.stereotype.Component;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;
import java.time.Instant;
import java.util.concurrent.TimeUnit;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@Slf4j
public class RequestLoggingFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        long startTime = System.nanoTime();

        String requestId = UUID.randomUUID().toString();

        String method = request.getMethod();
        String endpoint = request.getRequestURI();
        String action = getAction(method, endpoint);

        MDC.put("requestId", requestId);

        response.setHeader("X-Request-ID", requestId);

        boolean failed = false;

        try {

            filterChain.doFilter(request, response);

        } catch (ServletException | IOException | RuntimeException ex) {

            failed = true;
            throw ex;

        } finally {

            long responseTime = TimeUnit.NANOSECONDS.toMillis(
                    System.nanoTime() - startTime
            );

            int statusCode = failed
                    ? 500
                    : response.getStatus();

            String status = statusCode >= 400
                    ? "FAILED"
                    : "SUCCESS";

            try {

                LoggingEventBuilder event;

                if (statusCode >= 500) {

                    event = log.atError();

                } else if (statusCode >= 400) {

                    event = log.atWarn();

                } else {

                    event = log.atInfo();

                }

                event
                    .addKeyValue("timestamp", Instant.now().toString())
                    .addKeyValue("service", "usermanager-backend")
                    .addKeyValue("event_type", "HTTP_REQUEST")
                    .addKeyValue("action", action)
                    .addKeyValue("method", method)
                    .addKeyValue("endpoint", endpoint)
                    .addKeyValue("status_code", statusCode)
                    .addKeyValue("response_time_ms", responseTime)
                    .addKeyValue("request_id", requestId)
                    .addKeyValue("status", status)
                    .log("HTTP request completed");

            } finally {

                MDC.remove("requestId");

            }
        }
    }

    private String getAction(String method, String endpoint) {

        if (endpoint.equals("/api/auth/login")) {
            return "LOGIN";
        }

        if (endpoint.equals("/api/health")) {
            return "HEALTH_CHECK";
        }

        if (endpoint.startsWith("/actuator")) {
            return "MONITORING";
        }

        if (endpoint.equals("/api/users")
                || endpoint.startsWith("/api/users/")) {

            return switch (method) {

                case "POST" -> "CREATE_USER";

                case "GET" -> endpoint.equals("/api/users")
                        ? "LIST_USERS"
                        : "GET_USER";

                case "PUT" -> "UPDATE_USER";

                case "DELETE" -> "DELETE_USER";

                case "PATCH" -> "UPDATE_USER_STATUS";

                default -> "UNKNOWN_ACTION";
            };
        }

        return "HTTP_REQUEST";
    }
}
