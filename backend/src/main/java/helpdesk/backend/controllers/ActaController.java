package helpdesk.backend.controllers;

import helpdesk.backend.dtos.ActaResponse;
import helpdesk.backend.services.ActaService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Actas digitales. Las crea MovimientoService automaticamente; aqui solo se
 * consultan y descargan. Un colaborador solo accede a sus propias actas.
 */
@RestController
@RequestMapping("/api/actas")
@RequiredArgsConstructor
public class ActaController {

    private final ActaService actaService;

    @GetMapping
    public ResponseEntity<List<ActaResponse>> listar(@RequestParam(required = false) Integer ticketId,
                                                     Authentication auth) {
        return ResponseEntity.ok(actaService.listar(auth, ticketId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ActaResponse> obtener(@PathVariable Integer id, Authentication auth) {
        return ResponseEntity.ok(actaService.obtener(id, auth));
    }

    // HU-18: el colaborador firma su acta. Body: { "nombre": "...", "acepto": true }
    @PostMapping("/{id}/firmar")
    public ResponseEntity<ActaResponse> firmar(@PathVariable Integer id,
                                               @RequestBody FirmaRequest request,
                                               HttpServletRequest http,
                                               Authentication auth) {
        return ResponseEntity.ok(actaService.firmar(id, request.nombre(), request.acepto(), ipCliente(http), auth));
    }

    public record FirmaRequest(String nombre, boolean acepto) {}

    // IP real del cliente aunque el backend este detras de un proxy (Nginx, Azure)
    private static String ipCliente(HttpServletRequest http) {
        String reenviada = http.getHeader("X-Forwarded-For");
        String ip = (reenviada != null && !reenviada.isBlank()) ? reenviada.split(",")[0].trim() : http.getRemoteAddr();
        return ip.length() > 45 ? ip.substring(0, 45) : ip;
    }

    // Descarga el PDF. ?ver=true lo abre en el navegador en lugar de descargarlo
    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> pdf(@PathVariable Integer id,
                                      @RequestParam(defaultValue = "false") boolean ver,
                                      @RequestParam(defaultValue = "false") boolean original,
                                      Authentication auth) {
        // Si el acta ya fue firmada se entrega el PDF firmado (?original=true para el original)
        ActaService.ArchivoActa archivo = actaService.descargar(id, original, auth);
        ContentDisposition disposicion = (ver ? ContentDisposition.inline() : ContentDisposition.attachment())
                .filename(archivo.nombre(), StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, disposicion.toString())
                .body(archivo.contenido());
    }
}
