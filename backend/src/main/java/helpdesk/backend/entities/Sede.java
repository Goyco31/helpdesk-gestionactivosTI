package helpdesk.backend.entities;

import jakarta.persistence.*;
import lombok.Data;

/** Lugar fisico: San Isidro o Planta Callao. Aplica a colaboradores y activos. */
@Data
@Entity
@Table(name = "sede")
public class Sede {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true)
    private String nombre;
}
