package helpdesk.backend.services;

import helpdesk.backend.dtos.TicketRequest;
import helpdesk.backend.entities.Ticket;
import helpdesk.backend.entities.Usuario;
import helpdesk.backend.repositories.TicketRepository;
import helpdesk.backend.repositories.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UsuarioRepository usuarioRepository;

    public Ticket crearTicket(TicketRequest request, String correoUsuario) {
        Usuario autor = usuarioRepository.findByCorreo(correoUsuario)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado en la base de datos"));

        Ticket nuevoTicket = new Ticket();
        nuevoTicket.setUsuario(autor);
        nuevoTicket.setAsunto(request.getAsunto());
        nuevoTicket.setCategoria(request.getCategoria());
        nuevoTicket.setPrioridad(request.getPrioridad());
        nuevoTicket.setEstado("Abierto"); // Estado inicial por defecto

        return ticketRepository.save(nuevoTicket);
    }

    public List<Ticket> listarTodos() {
        return ticketRepository.findAll();
    }

    /**
     * Control de acceso a nivel de datos: un USUARIO solo ve los tickets que el mismo creo.
     */
    public List<Ticket> listarSegunRol(Authentication auth) {
        boolean esPersonalTI = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(r -> r.equals("ROLE_ADMIN") || r.equals("ROLE_SOPORTE"));
        if (esPersonalTI) {
            return ticketRepository.findAll();
        }
        Usuario usuario = usuarioRepository.findByCorreo(auth.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado en la base de datos"));
        return ticketRepository.findByUsuarioId(usuario.getId());
    }
}