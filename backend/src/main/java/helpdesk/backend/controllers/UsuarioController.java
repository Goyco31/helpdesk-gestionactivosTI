package helpdesk.backend.controllers;

import helpdesk.backend.dtos.UsuarioResumen;
import helpdesk.backend.repositories.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Lista de colaboradores para las pantallas de asignacion (ADMIN/SOPORTE). */
@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;

    @GetMapping
    public ResponseEntity<List<UsuarioResumen>> listar() {
        return ResponseEntity.ok(usuarioRepository.findAll(Sort.by("apellidos", "nombres"))
                .stream().map(UsuarioResumen::de).toList());
    }
}
