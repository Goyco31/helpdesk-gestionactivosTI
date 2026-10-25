package helpdesk.backend.controllers;

import helpdesk.backend.services.ReporteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** Reportes de inventario e indicadores KPI/SLA (solo ADMIN, ver SecurityConfig). */
@RestController
@RequestMapping("/api/reportes")
@RequiredArgsConstructor
public class ReporteController {

    private final ReporteService reporteService;

    // ?sede=San Isidro&dias=30
    @GetMapping("/resumen")
    public ResponseEntity<ReporteService.Resumen> resumen(@RequestParam(required = false) String sede,
                                                          @RequestParam(defaultValue = "30") int dias) {
        return ResponseEntity.ok(reporteService.resumen(sede, dias));
    }
}
