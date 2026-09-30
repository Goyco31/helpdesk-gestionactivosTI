package helpdesk.backend.entities;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "ticket")
public class Ticket {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(nullable = false, length = 200)
    private String asunto;

    @Column(nullable = false, length = 50)
    private String categoria;

    @Column(nullable = false, length = 20)
    private String prioridad;

    @Column(nullable = false, length = 30)
    private String estado;

    @Column(name = "fecha_creacion", insertable = false, updatable = false)
    private LocalDateTime fechaCreacion;
}