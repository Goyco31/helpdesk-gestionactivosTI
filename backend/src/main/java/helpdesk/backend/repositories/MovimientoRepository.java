package helpdesk.backend.repositories;

import helpdesk.backend.entities.Movimiento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MovimientoRepository extends JpaRepository<Movimiento, Integer> {

    List<Movimiento> findByActivoIdOrderByFechaDescIdDesc(Integer activoId);

    List<Movimiento> findByTicketIdOrderByFechaDescIdDesc(Integer ticketId);

    List<Movimiento> findAllByOrderByFechaDescIdDesc();
}
