package helpdesk.backend.dtos;

import helpdesk.backend.actas.ActaPdfGenerator;
import helpdesk.backend.entities.Acta;
import helpdesk.backend.entities.ActaDetalle;

import java.time.LocalDateTime;
import java.util.List;

public record ActaResponse(
        Integer id,
        String codigo,          // ACT-000045
        String tipo,            // Entrega, Devolucion, Prestamo
        String estado,          // pendiente_firma, firmada, anulada
        LocalDateTime fechaGeneracion,
        Integer ticketId,
        Integer movimientoId,
        Integer usuarioId,
        String colaborador,
        String tecnico,
        String archivo,         // nombre del PDF
        String urlDescarga,     // GET /api/actas/{id}/pdf
        List<Equipo> equipos
) {
    public record Equipo(Integer activoId, String codigoPatrimonial, String marca, String modelo, String numeroSerie) {}

    public static ActaResponse de(Acta a, List<ActaDetalle> detalles) {
        String archivo = a.getUrlPdf() == null ? null : a.getUrlPdf().substring(a.getUrlPdf().lastIndexOf('/') + 1);
        return new ActaResponse(
                a.getId(),
                ActaPdfGenerator.codigo(a),
                a.getTipoActa(),
                a.getEstado(),
                a.getFechaGeneracion(),
                a.getTicket().getId(),
                a.getMovimiento().getId(),
                a.getUsuario().getId(),
                a.getUsuario().getNombreCompleto(),
                a.getMovimiento().getRegistradoPor().getNombreCompleto(),
                archivo,
                "/api/actas/" + a.getId() + "/pdf",
                detalles.stream().map(d -> new Equipo(d.getActivo().getId(), d.getActivo().getCodigoPatrimonial(),
                        d.getMarca(), d.getModelo(), d.getNumeroSerie())).toList());
    }
}
