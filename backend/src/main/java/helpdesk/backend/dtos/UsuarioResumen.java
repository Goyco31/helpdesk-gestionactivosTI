package helpdesk.backend.dtos;

import helpdesk.backend.entities.Usuario;

/** Datos basicos de un usuario para listas desplegables (sin datos sensibles). */
public record UsuarioResumen(Integer id, String nombreCompleto, String correo,
                             String area, String sede, String sociedad, String rol) {
    public static UsuarioResumen de(Usuario u) {
        return new UsuarioResumen(
                u.getId(), u.getNombreCompleto(), u.getCorreo(),
                u.getArea() == null ? null : u.getArea().getNombre(),
                u.getSede() == null ? null : u.getSede().getNombre(),
                u.getSociedad() == null ? null : u.getSociedad().getNombre(),
                u.getRol().getNombre());
    }
}
