package helpdesk.backend.dtos;

import helpdesk.backend.entities.Usuario;

/** Datos basicos de un usuario para listas desplegables (sin datos sensibles). */
public record UsuarioResumen(Integer id, String nombreCompleto, String correo, String area, String rol) {
    public static UsuarioResumen de(Usuario u) {
        return new UsuarioResumen(u.getId(), u.getNombreCompleto(), u.getCorreo(), u.getArea(), u.getRol().getNombre());
    }
}
