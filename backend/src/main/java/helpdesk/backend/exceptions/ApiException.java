package helpdesk.backend.exceptions;

import org.springframework.http.HttpStatus;

/**
 * Error de negocio con su codigo HTTP (ej. 404 si no existe, 409 si hay conflicto).
 */
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(HttpStatus status, String mensaje) {
        super(mensaje);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
