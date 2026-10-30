package helpdesk.backend.repositories;

import helpdesk.backend.entities.Sede;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SedeRepository extends JpaRepository<Sede, Integer> {
    Optional<Sede> findByNombreIgnoreCase(String nombre);
}
