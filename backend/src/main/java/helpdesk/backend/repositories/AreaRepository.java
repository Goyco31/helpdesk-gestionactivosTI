package helpdesk.backend.repositories;

import helpdesk.backend.entities.Area;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AreaRepository extends JpaRepository<Area, Integer> {
    Optional<Area> findByNombreIgnoreCase(String nombre);
}
