package helpdesk.backend.controllers;

import helpdesk.backend.dtos.ActivoRequest;
import helpdesk.backend.dtos.ActivoResponse;
import helpdesk.backend.dtos.MovimientoResponse;
import helpdesk.backend.services.ActivoService;
import helpdesk.backend.services.MovimientoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/activos")
@RequiredArgsConstructor
public class ActivoController {

    private final ActivoService activoService;
    private final MovimientoService movimientoService;

    // Inventario (ADMIN/SOPORTE). Oculta los "de baja" salvo ?incluirBaja=true
    @GetMapping
    public ResponseEntity<List<ActivoResponse>> listar(@RequestParam(defaultValue = "false") boolean incluirBaja) {
        return ResponseEntity.ok(activoService.listar(incluirBaja));
    }

    // RF03: cualquier usuario autenticado ve SUS activos asignados (solo lectura)
    @GetMapping("/mis-activos")
    public ResponseEntity<List<ActivoResponse>> misActivos(Authentication auth) {
        return ResponseEntity.ok(activoService.misActivos(auth.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ActivoResponse> obtener(@PathVariable Integer id) {
        return ResponseEntity.ok(activoService.obtener(id));
    }

    // RF09: trazabilidad completa del activo, del mas reciente al mas antiguo
    @GetMapping("/{id}/historial")
    public ResponseEntity<List<MovimientoResponse>> historial(@PathVariable Integer id) {
        return ResponseEntity.ok(movimientoService.historialDeActivo(id));
    }

    // RF04: editar datos del activo (el estado cambia solo con un movimiento)
    @PutMapping("/{id}")
    public ResponseEntity<ActivoResponse> actualizar(@PathVariable Integer id, @RequestBody ActivoRequest request) {
        return ResponseEntity.ok(activoService.actualizar(id, request));
    }

    @PostMapping("/registrar")
    public ResponseEntity<ActivoResponse> crear(@RequestBody ActivoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(activoService.crearActivo(request));
    }
}
