package helpdesk.backend.dtos;

import lombok.Data;

@Data
public class RegisterRequest {
    private String nombres;
    private String apellidos;
    private String correo;
    private String password;
    private String dni;
    private String cargo;
    private String celular;
    // Nombres tal como aparecen en los catalogos (GET /api/catalogos/...)
    private String area;      // departamento, ej. "Sistemas"
    private String sede;      // ej. "San Isidro"
    private String sociedad;  // ej. "Terpel Perú"
    // Rol de la nueva cuenta: admin, soporte o usuario (si se omite, usuario)
    private String rol;
}