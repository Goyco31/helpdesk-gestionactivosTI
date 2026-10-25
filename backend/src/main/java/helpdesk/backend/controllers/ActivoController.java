package helpdesk.backend.controllers;

import helpdesk.backend.entities.Activo;
import helpdesk.backend.services.ActivoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/activos")
@RequiredArgsConstructor
public class ActivoController {

    private final ActivoService activoService;

    @GetMapping
    public ResponseEntity<List<Activo>> listar() {
        return ResponseEntity.ok(activoService.listarTodos());
    }

    // Solución: Añadimos "/registrar" para que coincida con la URL de tu Axios en React
    @PostMapping("/registrar")
    public ResponseEntity<Activo> crear(@RequestBody Activo activo) {
        return ResponseEntity.ok(activoService.crearActivo(activo));
    }
}