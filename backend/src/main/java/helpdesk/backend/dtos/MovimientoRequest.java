package helpdesk.backend.dtos;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDate;

/**
 * Datos de un movimiento. Segun el endpoint se usan unos u otros campos:
 *  - asignar:       activoId, ticketId, usuarioDestinoId
 *  - prestar:       activoId, ticketId, usuarioDestinoId, fechaDevolucionPrevista
 *  - devolver:      activoId, ticketId, estadoDestino (opcional, por defecto "por asignar")
 *  - reasignar:     activoId, ticketId, usuarioDestinoId
 *  - cambiar-estado: activoId, ticketId, estadoDestino
 */
@JsonIgnoreProperties(ignoreUnknown = true) // el Front puede enviar campos extra (ej. sede)
public record MovimientoRequest(
        Integer activoId,
        Integer ticketId,
        Integer usuarioDestinoId,
        String estadoDestino,
        LocalDate fechaDevolucionPrevista,
        String observacion
) {}
