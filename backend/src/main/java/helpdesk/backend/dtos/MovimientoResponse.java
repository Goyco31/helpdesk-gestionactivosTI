package helpdesk.backend.dtos;

import helpdesk.backend.entities.Movimiento;
import helpdesk.backend.entities.Usuario;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record MovimientoResponse(
        Integer id,
        String tipo,
        LocalDateTime fecha,
        Integer activoId,
        String codigoPatrimonial,
        Integer ticketId,
        String usuarioOrigen,
        String usuarioDestino,
        String estadoAnterior,
        String estadoNuevo,
        String registradoPor,
        LocalDate fechaDevolucionPrevista,
        String observacion,
        Integer actaId
) {
    public static MovimientoResponse de(Movimiento m) {
        return new MovimientoResponse(
                m.getId(),
                m.getTipo(),
                m.getFecha(),
                m.getActivo().getId(),
                m.getActivo().getCodigoPatrimonial(),
                m.getTicket().getId(),
                nombre(m.getUsuarioOrigen()),
                nombre(m.getUsuarioDestino()),
                m.getEstadoAnterior().getNombre(),
                m.getEstadoNuevo().getNombre(),
                nombre(m.getRegistradoPor()),
                m.getFechaDevolucionPrevista(),
                m.getObservacion(),
                m.getActa() == null ? null : m.getActa().getId());
    }

    private static String nombre(Usuario u) {
        return u == null ? null : u.getNombreCompleto();
    }
}
