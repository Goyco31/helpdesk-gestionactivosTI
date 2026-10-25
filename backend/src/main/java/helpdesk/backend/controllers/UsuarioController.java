package helpdesk.backend.controllers;

import helpdesk.backend.dtos.CambioRolRequest;
import helpdesk.backend.dtos.UsuarioResumen;
import helpdesk.backend.services.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;

    // Lista de usuarios (ADMIN y SOPORTE, ver SecurityConfig)
    @GetMapping
    public ResponseEntity<List<UsuarioResumen>> listar() {
        return ResponseEntity.ok(usuarioService.listar());
    }

    // HU-14: solo el administrador cambia roles
    @PatchMapping("/{id}/rol")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UsuarioResumen> cambiarRol(@PathVariable Integer id,
                                                     @RequestBody CambioRolRequest request,
                                                     Authentication auth) {
        return ResponseEntity.ok(usuarioService.cambiarRol(id, request.rol(), auth.getName()));
    }
}
