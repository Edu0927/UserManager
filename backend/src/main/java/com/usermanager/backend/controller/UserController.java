package com.usermanager.backend.controller;

import com.usermanager.backend.dto.*;
import com.usermanager.backend.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // CREATE
    @PostMapping
    public ResponseEntity<UserResponse> create(
            @Valid @RequestBody UserRequest request
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(userService.create(request));
    }

    // READ ALL
    @GetMapping
    public ResponseEntity<List<UserResponse>> findAll() {

        return ResponseEntity.ok(
            userService.findAll()
        );
    }

    // READ BY ID
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> findById(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
            userService.findById(id)
        );
    }

    // UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UserUpdateRequest request,
            Principal principal
    ) {

        return ResponseEntity.ok(
            userService.update(
                id,
                request,
                principal.getName()
            )
        );
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            Principal principal
    ) {

        userService.delete(id, principal.getName());

        return ResponseEntity.noContent().build();
    }

    // UPDATE STATUS
    @PatchMapping("/{id}/status")
    public ResponseEntity<UserResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UserStatusRequest request,
            Principal principal
    ) {

        return ResponseEntity.ok(
            userService.updateStatus(
                id,
                request.active(),
                principal.getName()
            )
        );
    }
}
