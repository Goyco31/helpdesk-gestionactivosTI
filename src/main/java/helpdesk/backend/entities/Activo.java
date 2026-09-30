package helpdesk.backend.entities;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "activo")
public class Activo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "codigo_patrimonial", nullable = false, unique = true, length = 50)
    private String codigoPatrimonial;

    @Column(nullable = false, length = 50)
    private String categoria;

    @Column(length = 50)
    private String marca;

    @Column(length = 50)
    private String modelo;

    @Column(name = "numero_serie", length = 100)
    private String numeroSerie;

    @Column(nullable = false, length = 30)
    private String estado;
}