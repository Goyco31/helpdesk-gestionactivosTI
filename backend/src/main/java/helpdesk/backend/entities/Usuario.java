package helpdesk.backend.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data // Esta anotación de Lombok crea los Getters y Setters automáticamente
@Entity
@Table(name = "usuario")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 100)
    private String nombres;

    @Column(nullable = false, length = 100)
    private String apellidos;

    @Column(nullable = false, unique = true, length = 150)
    private String correo;

    @JsonIgnore // nunca se envia el hash en las respuestas JSON
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

    // Departamento (Sistemas, Legal, ...)
    @ManyToOne
    @JoinColumn(name = "area_id")
    private Area area;

    // Lugar fisico (San Isidro, Planta Callao)
    @ManyToOne
    @JoinColumn(name = "sede_id")
    private Sede sede;

    @ManyToOne
    @JoinColumn(name = "sociedad_id")
    private Sociedad sociedad;

    @JsonIgnore // nunca se envia el codigo 2FA en las respuestas JSON
    @Column(name = "codigo_2fa", length = 6)
    private String codigo2fa;

    @JsonIgnore
    @Column(name = "codigo_2fa_expira")
    private LocalDateTime codigo2faExpira;

    @JsonIgnore
    @Column(name = "codigo_2fa_intentos", nullable = false)
    private Short codigo2faIntentos = 0;

    /** "Nombres Apellidos", para mostrar en pantallas y respuestas. */
    @Transient
    public String getNombreCompleto() {
        return (nombres + " " + (apellidos == null ? "" : apellidos)).trim();
    }

    /**
     * "Primer nombre + primer apellido", usado para nombrar los PDF
     * (ej. "Jose Fernandez").
     */
    @Transient
    @JsonIgnore
    public String getNombreCorto() {
        String primerNombre = nombres == null ? "" : nombres.trim().split("\\s+")[0];
        String primerApellido = (apellidos == null || apellidos.isBlank()) ? "" : apellidos.trim().split("\\s+")[0];
        return (primerNombre + " " + primerApellido).trim();
    }
}