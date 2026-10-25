package helpdesk.backend.entities;

import jakarta.persistence.*;
import lombok.Data;

/** Departamento del colaborador (Sistemas, Legal, Contabilidad...). */
@Data
@Entity
@Table(name = "area")
public class Area {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true)
    private String nombre;
}
