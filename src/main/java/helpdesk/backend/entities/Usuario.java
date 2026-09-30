package helpdesk.backend.entities;

import jakarta.persistence.*;
import lombok.Data;

@Data // Esta anotación de Lombok crea los Getters y Setters automáticamente
@Entity
@Table(name = "usuario")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false, unique = true, length = 150)
    private String correo;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "rol_id", nullable = false)
    private Integer rolId; 
    // Más adelante cambiaremos este Integer por una relación @ManyToOne con la entidad Rol
}