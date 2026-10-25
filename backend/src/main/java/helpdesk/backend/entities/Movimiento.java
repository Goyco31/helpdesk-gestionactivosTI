package helpdesk.backend.entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Historial de movimientos de un activo (tabla movimiento).
 *
 * Es inalterable: todas las columnas son updatable = false y, ademas, un
 * trigger en PostgreSQL rechaza cualquier UPDATE, DELETE o TRUNCATE.
 */
@Data
@Entity
@Table(name = "movimiento")
public class Movimiento {

    public static final String ASIGNACION = "asignacion";
    public static final String PRESTAMO = "prestamo";
    public static final String DEVOLUCION = "devolucion";
    public static final String REASIGNACION = "reasignacion";
    public static final String CAMBIO_ESTADO = "cambio_estado";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "activo_id", nullable = false, updatable = false)
    private Activo activo;

    @ManyToOne(optional = false)
    @JoinColumn(name = "ticket_id", nullable = false, updatable = false)
    private Ticket ticket;

    @Column(nullable = false, length = 20, updatable = false)
    private String tipo;

    @ManyToOne
    @JoinColumn(name = "usuario_origen_id", updatable = false)
    private Usuario usuarioOrigen;

    @ManyToOne
    @JoinColumn(name = "usuario_destino_id", updatable = false)
    private Usuario usuarioDestino;

    @ManyToOne(optional = false)
    @JoinColumn(name = "estado_anterior_id", nullable = false, updatable = false)
    private EstadoActivo estadoAnterior;

    @ManyToOne(optional = false)
    @JoinColumn(name = "estado_nuevo_id", nullable = false, updatable = false)
    private EstadoActivo estadoNuevo;

    @ManyToOne(optional = false)
    @JoinColumn(name = "registrado_por_id", nullable = false, updatable = false)
    private Usuario registradoPor;

    @Column(nullable = false, updatable = false)
    private LocalDateTime fecha = LocalDateTime.now();

    @Column(name = "fecha_devolucion_prevista", updatable = false)
    private LocalDate fechaDevolucionPrevista;

    @Column(length = 500, updatable = false)
    private String observacion;

    // Actas generadas por este movimiento (una reasignacion genera dos)
    @OneToMany(mappedBy = "movimiento")
    @OrderBy("id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Acta> actas = new ArrayList<>();
}
