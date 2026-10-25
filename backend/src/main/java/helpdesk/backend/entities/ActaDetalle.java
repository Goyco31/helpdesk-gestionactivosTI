package helpdesk.backend.entities;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "acta_detalle")
/**
 * Copia ("foto") del equipo al momento de emitir el acta. Si despues cambian
 * los datos del activo, el acta conserva lo que se entrego. Inalterable
 * (trigger trg_acta_detalle_inalterable).
 */
public class ActaDetalle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "acta_id", nullable = false, updatable = false)
    private Acta acta;

    @ManyToOne
    @JoinColumn(name = "activo_id", nullable = false, updatable = false)
    private Activo activo;

    @Column(length = 50, updatable = false)
    private String marca;

    @Column(length = 50, updatable = false)
    private String modelo;

    @Column(name = "numero_serie", length = 100, updatable = false)
    private String numeroSerie;
}