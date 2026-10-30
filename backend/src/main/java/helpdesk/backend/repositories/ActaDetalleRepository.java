package helpdesk.backend.repositories;

import helpdesk.backend.entities.ActaDetalle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ActaDetalleRepository extends JpaRepository<ActaDetalle, Integer> {
    List<ActaDetalle> findByActaIdOrderById(Integer actaId);
}
