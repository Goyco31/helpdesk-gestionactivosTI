package helpdesk.backend.entities;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "acta_detalle")
public class ActaDetalle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "acta_id", nullable = false)
    private Acta acta;

    @ManyToOne
    @JoinColumn(name = "activo_id", nullable = false)
    private Activo activo;

    @Column(length = 50)
    private String marca;

    @Column(length = 50)
    private String modelo;

    @Column(name = "numero_serie", length = 100)
    private String numeroSerie;
}