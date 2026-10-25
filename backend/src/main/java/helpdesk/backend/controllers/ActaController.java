package helpdesk.backend.controllers;

import helpdesk.backend.dtos.ActaResponse;
import helpdesk.backend.services.ActaService;
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

    // Descarga el PDF. ?ver=true lo abre en el navegador en lugar de descargarlo
    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> pdf(@PathVariable Integer id,
                                      @RequestParam(defaultValue = "false") boolean ver,
                                      Authentication auth) {
        ActaService.ArchivoActa archivo = actaService.descargar(id, auth);
        ContentDisposition disposicion = (ver ? ContentDisposition.inline() : ContentDisposition.attachment())
                .filename(archivo.nombre(), StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, disposicion.toString())
                .body(archivo.contenido());
    }
}
