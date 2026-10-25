package helpdesk.backend.services;

import helpdesk.backend.dtos.UsuarioResumen;
import helpdesk.backend.entities.Rol;
import helpdesk.backend.entities.Usuario;
import helpdesk.backend.exceptions.ApiException;
import helpdesk.backend.repositories.RolRepository;
import helpdesk.backend.repositories.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

/**
 * Gestion de usuarios y roles (HU-14, RF01).
 *
 * Reglas:
 *  - Solo un ADMIN cambia roles (ver UsuarioController).
 *  - Un administrador no puede cambiar su propio rol (evita quedarse sin acceso por error).
 *  - Siempre debe quedar al menos un administrador.
 *  - El cambio rige desde la siguiente peticion: el rol se lee de la BD en cada request.
 */
@Service
@RequiredArgsConstructor
public class UsuarioService {

    private static final Logger log = LoggerFactory.getLogger(UsuarioService.class);
    private static final Set<String> ROLES_VALIDOS = Set.of("admin", "soporte", "usuario");

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;

    @Transactional(readOnly = true)
    public List<UsuarioResumen> listar() {
        return usuarioRepository.findAll(Sort.by("apellidos", "nombres"))
                .stream().map(UsuarioResumen::de).toList();
    }

    @Transactional
    public UsuarioResumen cambiarRol(Integer id, String nuevoRol, String correoAdmin) {
        String nombreRol = nuevoRol == null ? "" : nuevoRol.trim().toLowerCase();
        if (!ROLES_VALIDOS.contains(nombreRol)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Rol inválido. Valores permitidos: admin, soporte, usuario");
        }

        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No existe el usuario " + id));

        if (usuario.getCorreo().equalsIgnoreCase(correoAdmin)) {
            throw new ApiException(HttpStatus.CONFLICT, "No puedes cambiar tu propio rol. Pídeselo a otro administrador.");
        }

        String rolActual = usuario.getRol().getNombre().toLowerCase();
        if (rolActual.equals(nombreRol)) {
            return UsuarioResumen.de(usuario);
        }
        if (rolActual.equals("admin") && usuarioRepository.countByRolNombreIgnoreCase("admin") <= 1) {
            throw new ApiException(HttpStatus.CONFLICT, "Debe quedar al menos un administrador en el sistema.");
        }

        Rol rol = rolRepository.findByNombreIgnoreCase(nombreRol)
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "El rol '" + nombreRol + "' no existe en la base de datos"));
        usuario.setRol(rol);
        usuarioRepository.save(usuario);

        // Queda registro de quien hizo el cambio (auditoria basica en el log)
        log.info("Rol de {} cambiado de {} a {} por {}", usuario.getCorreo(), rolActual, nombreRol, correoAdmin);
        return UsuarioResumen.de(usuario);
    }
}
