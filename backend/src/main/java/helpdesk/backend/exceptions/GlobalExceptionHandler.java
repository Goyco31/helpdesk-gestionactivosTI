package helpdesk.backend.exceptions;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Convierte las excepciones en respuestas JSON con un codigo HTTP correcto,
 * en lugar de devolver un 403/500 generico.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, Object>> handleApi(ApiException e, HttpServletRequest req) {
        return respuesta(e.getStatus(), e.getMessage(), req);
    }

    // Credenciales incorrectas en /api/auth/login
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Map<String, Object>> handleAuth(AuthenticationException e, HttpServletRequest req) {
        return respuesta(HttpStatus.UNAUTHORIZED, "Correo o contraseña incorrectos", req);
    }

    // Rol sin permiso en un metodo protegido con @PreAuthorize
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleDenied(AccessDeniedException e, HttpServletRequest req) {
        return respuesta(HttpStatus.FORBIDDEN, "Tu rol no tiene permiso para esta operación", req);
    }

    // Violacion de UNIQUE / FK en la base de datos (ej. codigo patrimonial o correo repetido)
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleIntegrity(DataIntegrityViolationException e, HttpServletRequest req) {
        log.warn("Violacion de integridad en {}: {}", req.getRequestURI(), e.getMostSpecificCause().getMessage());
        return respuesta(HttpStatus.CONFLICT, "El registro entra en conflicto con datos existentes (valor duplicado o referencia inválida)", req);
    }

    // Validaciones simples que lanzan RuntimeException en los servicios
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntime(RuntimeException e, HttpServletRequest req) {
        log.warn("Error en {}: {}", req.getRequestURI(), e.getMessage());
        return respuesta(HttpStatus.BAD_REQUEST, e.getMessage(), req);
    }

    private ResponseEntity<Map<String, Object>> respuesta(HttpStatus status, String mensaje, HttpServletRequest req) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("mensaje", mensaje);
        body.put("ruta", req.getRequestURI());
        return ResponseEntity.status(status).body(body);
    }
}
