package helpdesk.backend.controllers;

import helpdesk.backend.dtos.AuthResponse;
import helpdesk.backend.dtos.LoginRequest;
import helpdesk.backend.dtos.RegisterRequest;
import helpdesk.backend.dtos.Verify2faRequest;
import helpdesk.backend.services.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/verify-2fa")
    public ResponseEntity<AuthResponse> verify2fa(@RequestBody Verify2faRequest request) {
        return ResponseEntity.ok(authService.verify2fa(request));
    }
}