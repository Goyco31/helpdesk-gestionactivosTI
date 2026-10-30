package helpdesk.backend.controllers;

import helpdesk.backend.dtos.MovimientoRequest;
import helpdesk.backend.dtos.MovimientoResponse;
import helpdesk.backend.services.MovimientoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Movimientos de activos. Solo ADMIN y SOPORTE (ver SecurityConfig).
 * El tecnico que registra el movimiento se toma del token, no del cuerpo.
 */
@RestController
@RequestMapping("/api/movimientos")
@RequiredArgsConstructor
public class MovimientoController {

    private final MovimientoService movimientoService;

    @PostMapping("/asignar")
    public ResponseEntity<MovimientoResponse> asignar(@RequestBody MovimientoRequest req, Authentication auth) {
        return creado(movimientoService.asignar(req, auth.getName()));
    }

    @PostMapping("/prestar")
    public ResponseEntity<MovimientoResponse> prestar(@RequestBody MovimientoRequest req, Authentication auth) {
        return creado(movimientoService.prestar(req, auth.getName()));
    }

    @PostMapping("/devolver")
    public ResponseEntity<MovimientoResponse> devolver(@RequestBody MovimientoRequest req, Authentication auth) {
        return creado(movimientoService.devolver(req, auth.getName()));
    }

    @PostMapping("/reasignar")
    public ResponseEntity<MovimientoResponse> reasignar(@RequestBody MovimientoRequest req, Authentication auth) {
        return creado(movimientoService.reasignar(req, auth.getName()));
    }

    @PostMapping("/cambiar-estado")
    public ResponseEntity<MovimientoResponse> cambiarEstado(@RequestBody MovimientoRequest req, Authentication auth) {
        return creado(movimientoService.cambiarEstado(req, auth.getName()));
    }

    // Historial general, o filtrado por ticket con ?ticketId=
    @GetMapping
    public ResponseEntity<List<MovimientoResponse>> listar(@RequestParam(required = false) Integer ticketId) {
        return ResponseEntity.ok(movimientoService.listar(ticketId));
    }

    private static ResponseEntity<MovimientoResponse> creado(MovimientoResponse r) {
        return ResponseEntity.status(HttpStatus.CREATED).body(r);
    }
}
