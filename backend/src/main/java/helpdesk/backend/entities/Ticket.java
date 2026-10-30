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
}