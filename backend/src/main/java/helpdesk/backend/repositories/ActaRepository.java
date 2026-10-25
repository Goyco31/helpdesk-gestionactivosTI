package helpdesk.backend.repositories;

import helpdesk.backend.entities.Acta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ActaRepository extends JpaRepository<Acta, Integer> {

    List<Acta> findAllByOrderByIdDesc();

    List<Acta> findByUsuarioIdOrderByIdDesc(Integer usuarioId);

    List<Acta> findByTicketIdOrderByIdDesc(Integer ticketId);
}
