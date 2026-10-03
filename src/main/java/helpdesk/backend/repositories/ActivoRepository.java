package helpdesk.backend.repositories;

import helpdesk.backend.entities.Activo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ActivoRepository extends JpaRepository<Activo, Integer> {
    Optional<Activo> findByCodigoPatrimonial(String codigoPatrimonial);
}