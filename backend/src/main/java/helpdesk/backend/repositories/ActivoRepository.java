package helpdesk.backend.repositories;

import helpdesk.backend.entities.Activo;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ActivoRepository extends JpaRepository<Activo, Integer> {

    Optional<Activo> findByCodigoPatrimonial(String codigoPatrimonial);

    boolean existsByCodigoPatrimonialIgnoreCase(String codigoPatrimonial);

    // Activos visibles en el inventario (oculta "de baja")
    List<Activo> findByEstadoNombreNotOrderByIdDesc(String estadoExcluido);

    List<Activo> findAllByOrderByIdDesc();

    // Activos que tiene un colaborador (RF03)
    List<Activo> findByUsuarioActualIdOrderByIdDesc(Integer usuarioId);

    /**
     * Bloquea la fila del activo hasta que termine la transaccion
     * (SELECT ... FOR UPDATE). Si dos tecnicos intentan asignar el mismo
     * equipo a la vez, el segundo espera y luego ve el estado ya cambiado,
     * asi que su asignacion es rechazada.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from Activo a where a.id = :id")
    Optional<Activo> findByIdParaActualizar(@Param("id") Integer id);
}
