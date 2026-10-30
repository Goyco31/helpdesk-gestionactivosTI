package helpdesk.backend.repositories;

import helpdesk.backend.entities.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {
    // Spring Data JPA crea automáticamente la consulta SQL con solo nombrar el método así:
    Optional<Usuario> findByCorreo(String correo);

    boolean existsByCorreoIgnoreCase(String correo);

    boolean existsByDni(String dni);

    long countByRolNombreIgnoreCase(String rol);
}