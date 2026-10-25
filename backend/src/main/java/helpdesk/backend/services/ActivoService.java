package helpdesk.backend.services;

import helpdesk.backend.dtos.ActivoRequest;
import helpdesk.backend.dtos.ActivoResponse;
import helpdesk.backend.entities.Activo;
import helpdesk.backend.entities.CategoriaActivo;
import helpdesk.backend.entities.EstadoActivo;
import helpdesk.backend.entities.Usuario;
import helpdesk.backend.exceptions.ApiException;
import helpdesk.backend.repositories.ActivoRepository;
import helpdesk.backend.repositories.CategoriaActivoRepository;
import helpdesk.backend.repositories.EstadoActivoRepository;
import helpdesk.backend.repositories.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ActivoService {

    private static final String FORMATO_CODIGO = "^TERPEL \\d{1,8}$";

    private final ActivoRepository activoRepository;
    private final CategoriaActivoRepository categoriaRepository;
    private final EstadoActivoRepository estadoRepository;
    private final UsuarioRepository usuarioRepository;

    /** Inventario. Por defecto oculta los activos "de baja", como en el Excel actual. */
    @Transactional(readOnly = true)
    public List<ActivoResponse> listar(boolean incluirBaja) {
        List<Activo> activos = incluirBaja
                ? activoRepository.findAllByOrderByIdDesc()
                : activoRepository.findByEstadoNombreNotOrderByIdDesc(EstadoActivo.DE_BAJA);
        return activos.stream().map(ActivoResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public ActivoResponse obtener(Integer id) {
        return ActivoResponse.de(buscar(id));
    }

    /** RF03: activos que tiene asignados el colaborador autenticado (solo lectura). */
    @Transactional(readOnly = true)
    public List<ActivoResponse> misActivos(String correo) {
        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        return activoRepository.findByUsuarioActualIdOrderByIdDesc(usuario.getId())
                .stream().map(ActivoResponse::de).toList();
    }

    @Transactional
    public ActivoResponse crearActivo(ActivoRequest request) {
        String codigo = request.codigoPatrimonial() == null ? null : request.codigoPatrimonial().trim();
        if (codigo == null || !codigo.matches(FORMATO_CODIGO)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "El código patrimonial debe ser 'TERPEL ' seguido de 1 a 8 números");
        }
        if (activoRepository.existsByCodigoPatrimonialIgnoreCase(codigo)) {
            throw new ApiException(HttpStatus.CONFLICT, "Ya existe un activo con el código " + codigo);
        }
        if (request.categoria() == null || request.categoria().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "La categoría es obligatoria");
        }
        CategoriaActivo categoria = categoriaRepository.findByNombreIgnoreCase(request.categoria().trim())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST,
                        "Categoría no válida: " + request.categoria()));

        Activo activo = new Activo();
        activo.setCodigoPatrimonial(codigo);
        activo.setCategoria(categoria);
        activo.setMarca(request.marca());
        activo.setModelo(request.modelo());
        activo.setNumeroSerie(request.numeroSerie());
        // Todo equipo nuevo entra al almacen sin dueño
        activo.setEstado(estado(EstadoActivo.POR_ASIGNAR));
        activo.setUsuarioActual(null);

        return ActivoResponse.de(activoRepository.save(activo));
    }

    Activo buscar(Integer id) {
        if (id == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Falta el id del activo");
        }
        return activoRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No existe el activo " + id));
    }

    EstadoActivo estado(String nombre) {
        return estadoRepository.findByNombreIgnoreCase(nombre)
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Falta el estado '" + nombre + "' en el catálogo estado_activo. ¿Se ejecutó la migración V2?"));
    }
}
