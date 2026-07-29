package com.securebank.exception;

import com.securebank.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<?>> handleAuth(AuthenticationException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Non authentifié : " + e.getMessage()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<?>> handleAccess(AccessDeniedException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Accès interdit"));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse<?>> handleRuntime(RuntimeException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> handleAll(Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.error("Erreur interne du serveur"));
    }
}
