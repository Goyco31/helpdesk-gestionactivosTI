package helpdesk.backend.repositories;

import helpdesk.backend.entities.TicketComentario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TicketComentarioRepository extends JpaRepository<TicketComentario, Integer> {
    List<TicketComentario> findByTicketIdOrderByFechaAscIdAsc(Integer ticketId);
}
