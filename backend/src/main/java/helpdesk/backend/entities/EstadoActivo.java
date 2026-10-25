package helpdesk.backend.entities;

import jakarta.persistence.*;
import lombok.Data;

/**
 * Catalogo de estados del activo (tabla estado_activo).
 * Los nombres validos estan en {@link EstadoActivo#POR_ASIGNAR} y siguientes.
 */
@Data
@Entity
@Table(name = "estado_activo")
public class EstadoActivo {

    public static final String POR_ASIGNAR = "por asignar";
    public static final String EN_USO = "en uso";
    public static final String EN_PRESTAMO = "en préstamo";
    public static final String EN_MANTENIMIENTO = "en mantenimiento";
    public static final String PARA_DONAR = "para donar";
    public static final String PARA_BAJA = "para baja";
    public static final String DE_BAJA = "de baja";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true, length = 50)
    private String nombre;
}
