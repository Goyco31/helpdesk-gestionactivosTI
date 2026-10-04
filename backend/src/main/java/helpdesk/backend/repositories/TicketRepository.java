package helpdesk.backend.repositories;

import helpdesk.backend.entities.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TicketRepository extends JpaRepository<Ticket, Integer> {
    // Permite listar los tickets de un usuario específico
    List<Ticket> findByUsuarioId(Integer usuarioId);
}