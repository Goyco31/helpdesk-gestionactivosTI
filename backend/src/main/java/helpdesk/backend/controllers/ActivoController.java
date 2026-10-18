package helpdesk.backend.controllers;

import helpdesk.backend.entities.Activo;
import helpdesk.backend.services.ActivoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/activos")
public class ActivoController {

    private final ActivoService activoService;

    public ActivoController(ActivoService activoService) {
        this.activoService = activoService;
    }

    @GetMapping
    public ResponseEntity<List<Activo>> listar() {
        return ResponseEntity.ok(activoService.listarTodos());
    }

    @PostMapping
    public ResponseEntity<Activo> crear(@RequestBody Activo activo) {
        return ResponseEntity.ok(activoService.crearActivo(activo));
    }
}