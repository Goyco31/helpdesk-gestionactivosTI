package helpdesk.backend.services;

import helpdesk.backend.dtos.TicketRequest;
import helpdesk.backend.entities.Ticket;
import helpdesk.backend.entities.Usuario;
import helpdesk.backend.exceptions.ApiException;
import helpdesk.backend.repositories.TicketRepository;
import helpdesk.backend.repositories.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class TicketService {

    private static final Set<String> PRIORIDADES = Set.of("Baja", "Media", "Alta", "Crítica");
    private static final Set<String> ESTADOS = Set.of(
            Ticket.ABIERTO, Ticket.EN_PROCESO, Ticket.RESUELTO, Ticket.CERRADO);

    private final TicketRepository ticketRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional
    public Ticket crearTicket(TicketRequest request, String correoUsuario) {
        Usuario autor = usuarioRepository.findByCorreo(correoUsuario)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado en la base de datos"));

        if (esVacio(request.getAsunto()) || esVacio(request.getCategoria())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "El asunto y la categoría son obligatorios");
        }
        if (request.getPrioridad() == null || !PRIORIDADES.contains(request.getPrioridad())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Prioridad no válida. Valores permitidos: " + String.join(", ", PRIORIDADES));
        }

        Ticket nuevoTicket = new Ticket();
        nuevoTicket.setUsuario(autor);
        nuevoTicket.setAsunto(request.getAsunto().trim());
        nuevoTicket.setCategoria(request.getCategoria().trim());
        nuevoTicket.setPrioridad(request.getPrioridad());
        nuevoTicket.setEstado(Ticket.ABIERTO);

        return ticketRepository.save(nuevoTicket);
    }

    /**
     * Control de acceso a nivel de datos: un USUARIO solo ve los tickets que el mismo creo.
     */
    @Transactional(readOnly = true)
    public List<Ticket> listarSegunRol(Authentication auth) {
        if (esPersonalTI(auth)) {
            return ticketRepository.findAll();
        }
        return ticketRepository.findByUsuarioId(usuarioAutenticado(auth).getId());
    }

    @Transactional(readOnly = true)
    public Ticket obtener(Integer id, Authentication auth) {
        Ticket ticket = buscar(id);
        if (!esPersonalTI(auth) && !ticket.getUsuario().getId().equals(usuarioAutenticado(auth).getId())) {
            // Se responde 404 para no revelar que el ticket existe
            throw new ApiException(HttpStatus.NOT_FOUND, "No existe el ticket #" + id);
        }
        return ticket;
    }

    /**
     * RF10: Soporte/Admin actualiza el estado del ticket. Al resolverlo o cerrarlo se registra
     * fecha_finalizacion, que alimenta los KPI de cumplimiento de SLA y MTTR.
     */
    @Transactional
    public Ticket actualizarEstado(Integer id, String nuevoEstado, String correoTecnico) {
        if (nuevoEstado == null || !ESTADOS.contains(nuevoEstado)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Estado no válido. Valores permitidos: " + String.join(", ", ESTADOS));
        }
        Ticket ticket = buscar(id);
        if (Ticket.CERRADO.equals(ticket.getEstado())) {
            throw new ApiException(HttpStatus.CONFLICT, "El ticket #" + id + " está Cerrado y no puede modificarse");
        }

        boolean finaliza = Ticket.RESUELTO.equals(nuevoEstado) || Ticket.CERRADO.equals(nuevoEstado);
        if (finaliza && ticket.getFechaFinalizacion() == null) {
            ticket.setFechaFinalizacion(LocalDateTime.now());
        } else if (!finaliza) {
            ticket.setFechaFinalizacion(null); // reabierto
        }
        ticket.setEstado(nuevoEstado);

        if (ticket.getTecnico() == null) {
            ticket.setTecnico(usuarioRepository.findByCorreo(correoTecnico).orElse(null));
        }
        return ticketRepository.save(ticket);
    }

    private Ticket buscar(Integer id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No existe el ticket #" + id));
    }

    private Usuario usuarioAutenticado(Authentication auth) {
        return usuarioRepository.findByCorreo(auth.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado en la base de datos"));
    }

    private static boolean esPersonalTI(Authentication auth) {
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(r -> r.equals("ROLE_ADMIN") || r.equals("ROLE_SOPORTE"));
    }

    private static boolean esVacio(String s) {
        return s == null || s.isBlank();
    }
}
