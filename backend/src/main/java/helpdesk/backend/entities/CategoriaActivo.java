package helpdesk.backend.entities;

import jakarta.persistence.*;
import lombok.Data;

/** Catalogo de categorias de activo (Laptop, Monitor, Impresora, ...). */
@Data
@Entity
@Table(name = "categoria_activo")
public class CategoriaActivo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true, length = 50)
    private String nombre;
}
