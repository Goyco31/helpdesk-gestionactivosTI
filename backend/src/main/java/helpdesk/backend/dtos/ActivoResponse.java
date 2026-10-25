package helpdesk.backend.dtos;

import helpdesk.backend.entities.Activo;

import java.time.LocalDateTime;

public record ActivoResponse(
        Integer id,
        String codigoPatrimonial,
        String categoria,
        String marca,
        String modelo,
        String numeroSerie,
        String estado,
        String sede,
        String sociedad,
        Integer usuarioActualId,
        String usuarioActual,
        LocalDateTime fechaRegistro
) {
    public static ActivoResponse de(Activo a) {
        return new ActivoResponse(
                a.getId(),
                a.getCodigoPatrimonial(),
                a.getCategoria().getNombre(),
                a.getMarca(),
                a.getModelo(),
                a.getNumeroSerie(),
                a.getEstado().getNombre(),
                a.getSede() == null ? null : a.getSede().getNombre(),
                a.getSociedad() == null ? null : a.getSociedad().getNombre(),
                a.getUsuarioActual() == null ? null : a.getUsuarioActual().getId(),
                a.getUsuarioActual() == null ? null : a.getUsuarioActual().getNombreCompleto(),
                a.getFechaRegistro());
    }
}
