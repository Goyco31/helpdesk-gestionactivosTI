package helpdesk.backend.controllers;

import helpdesk.backend.dtos.MigracionActasResponse;
import helpdesk.backend.services.MigracionActasService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Administracion del almacenamiento de actas (cambio GC-11). Solo ADMIN (SecurityConfig).
 */
@RestController
@RequestMapping("/api/admin/actas")
public class AdminActaController {

    private final MigracionActasService migracionService;

    public AdminActaController(MigracionActasService migracionService) {
        this.migracionService = migracionService;
    }

    /** Que almacenamiento usa la API ahora y si Blob esta configurado. */
    @GetMapping("/almacenamiento")
    public ResponseEntity<Map<String, Object>> almacenamiento() {
        return ResponseEntity.ok(migracionService.estado());
    }

    /** Copia y verifica los PDF: hacia=blob (migracion) o hacia=local (reversion). */
    @PostMapping("/migrar")
    public ResponseEntity<MigracionActasResponse> migrar(@RequestParam String hacia) {
        return ResponseEntity.ok(migracionService.migrar(hacia));
    }
}
