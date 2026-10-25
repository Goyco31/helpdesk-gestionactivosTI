package helpdesk.backend.repositories;

import helpdesk.backend.entities.TicketActivo;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketActivoRepository extends JpaRepository<TicketActivo, Integer> {
    boolean existsByTicketIdAndActivoId(Integer ticketId, Integer activoId);
}
