package helpdesk.backend.entities;

import jakarta.persistence.*;
import lombok.Data;

/** Razon social: Terpel Peru o Terpel Comercial Peru. */
@Data
@Entity
@Table(name = "sociedad")
public class Sociedad {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true)
    private String nombre;

    // Prefijo para nombrar los equipos de esta sociedad (opcional)
    @Column(name = "prefijo_hostname", length = 20)
    private String prefijoHostname;
}
