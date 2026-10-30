package helpdesk.backend.dtos;

import helpdesk.backend.actas.ActaPdfGenerator;
import helpdesk.backend.entities.Movimiento;
import helpdesk.backend.entities.Usuario;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

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
        List<ActaResumen> actas
) {
    /** Acta generada por el movimiento (una reasignacion genera dos). */
    public record ActaResumen(Integer id, String codigo, String tipo, String urlDescarga) {}

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
                m.getActas().stream()
                        .map(a -> new ActaResumen(a.getId(), ActaPdfGenerator.codigo(a), a.getTipoActa(),
                                "/api/actas/" + a.getId() + "/pdf"))
                        .toList());
    }

    private static String nombre(Usuario u) {
        return u == null ? null : u.getNombreCompleto();
    }
}
