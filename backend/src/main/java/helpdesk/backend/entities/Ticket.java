package helpdesk.backend.entities;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "ticket")
public class Ticket {

    public static final String ABIERTO = "Abierto";
    public static final String EN_PROCESO = "En Proceso";
    public static final String RESUELTO = "Resuelto";
    public static final String CERRADO = "Cerrado";

    /** Solicitudes de acceso privilegiado del catalogo (seccion 8.1.4): exigen aprobacion. */
    public static final java.util.Set<String> SOLICITUDES_CON_APROBACION = java.util.Set.of("SOL-04", "SOL-05");

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(nullable = false, length = 200)
    private String asunto;

    @Column(length = 500)
    private String descripcion;

    @Column(nullable = false, length = 50)
    private String categoria;

    @Column(nullable = false, length = 20)
    private String prioridad;

    @Column(nullable = false, length = 30)
    private String estado;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    // Tecnico de soporte que atiende el ticket
    @ManyToOne
    @JoinColumn(name = "tecnico_id")
    private Usuario tecnico;

    // Se llena al pasar a Resuelto/Cerrado; base de los KPI de SLA y MTTR
    @Column(name = "fecha_finalizacion")
    private LocalDateTime fechaFinalizacion;

    // Codigo del catalogo de solicitudes (SOL-01 a SOL-06); null en incidencias
    @Column(name = "codigo_solicitud", length = 6)
    private String codigoSolicitud;

    // Aprobacion de la Jefatura de TI para accesos privilegiados (SOL-04, SOL-05)
    @ManyToOne
    @JoinColumn(name = "aprobado_por_id")
    private Usuario aprobadoPor;

    @Column(name = "fecha_aprobacion")
    private LocalDateTime fechaAprobacion;

    @Column(name = "evidencia_aprobacion", length = 300)
    private String evidenciaAprobacion;

    /** true si es un acceso privilegiado y por tanto necesita aprobacion antes de atenderse. */
    public boolean isRequiereAprobacion() {
        return codigoSolicitud != null && SOLICITUDES_CON_APROBACION.contains(codigoSolicitud);
    }

    /** true si ya tiene la aprobacion registrada (o no la necesita). */
    public boolean isAprobado() {
        return !isRequiereAprobacion() || aprobadoPor != null;
    }
}