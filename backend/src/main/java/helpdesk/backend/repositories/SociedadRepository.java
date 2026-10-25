package helpdesk.backend.repositories;

import helpdesk.backend.entities.Sociedad;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SociedadRepository extends JpaRepository<Sociedad, Integer> {
    Optional<Sociedad> findByNombreIgnoreCase(String nombre);
}
