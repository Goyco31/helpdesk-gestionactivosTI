package helpdesk.backend.entities;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "acta")
public class Acta {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "tipo_acta", nullable = false, length = 20)
    private String tipoActa;

    @Column(name = "fecha_generacion", nullable = false, updatable = false)
    private LocalDateTime fechaGeneracion = LocalDateTime.now();

    @Column(name = "url_pdf", length = 255, unique = true)
    private String urlPdf;

    // pendiente_firma, firmada, anulada
    @Column(nullable = false, length = 20)
    private String estado = "pendiente_firma";
}