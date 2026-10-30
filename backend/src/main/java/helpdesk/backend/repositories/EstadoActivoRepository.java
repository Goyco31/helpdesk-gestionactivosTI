package helpdesk.backend.repositories;

import helpdesk.backend.entities.EstadoActivo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EstadoActivoRepository extends JpaRepository<EstadoActivo, Integer> {
    Optional<EstadoActivo> findByNombreIgnoreCase(String nombre);
}
