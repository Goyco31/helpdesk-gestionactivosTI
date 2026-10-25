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
    private String area;
    // Rol de la nueva cuenta: admin, soporte o usuario (si se omite, usuario)
    private String rol;
}