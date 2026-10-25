package helpdesk.backend.repositories;

import helpdesk.backend.entities.CategoriaActivo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CategoriaActivoRepository extends JpaRepository<CategoriaActivo, Integer> {
    Optional<CategoriaActivo> findByNombreIgnoreCase(String nombre);
}
