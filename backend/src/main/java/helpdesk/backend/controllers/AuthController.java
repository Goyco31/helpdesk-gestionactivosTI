package helpdesk.backend.controllers;

import helpdesk.backend.dtos.AuthResponse;
import helpdesk.backend.dtos.LoginRequest;
import helpdesk.backend.dtos.RegisterRequest;
import helpdesk.backend.dtos.Verify2faRequest;
import helpdesk.backend.services.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // Requiere rol ADMIN (ver SecurityConfig)
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    // Publico. Credenciales incorrectas -> 401 (GlobalExceptionHandler)
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    // Publico. Codigo incorrecto -> 401
    @PostMapping("/verify-2fa")
    public ResponseEntity<AuthResponse> verify2fa(@RequestBody Verify2faRequest request) {
        return ResponseEntity.ok(authService.verify2fa(request));
    }
}
