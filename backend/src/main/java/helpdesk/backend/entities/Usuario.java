package helpdesk.backend.entities;

import jakarta.persistence.*;
import lombok.Data;

@Data // Esta anotación de Lombok crea los Getters y Setters automáticamente
@Entity
@Table(name = "usuario")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false, unique = true, length = 150)
    private String correo;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @ManyToOne
    @JoinColumn(name = "rol_id", nullable = false)
    private Rol rol;

    @Column(unique = true, length = 15)
    private String dni;

    @Column(length = 100)
    private String cargo;

    @Column(length = 20)
    private String celular;

    @Column(length = 100)
    private String area;

    @Column(name = "codigo_2fa", length = 6)
    private String codigo2fa;
}