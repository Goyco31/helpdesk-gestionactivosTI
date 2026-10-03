package helpdesk.backend.dtos;

import lombok.Data;

@Data
public class RegisterRequest {
    private String nombre;
    private String correo;
    private String password;
    private String dni;
    private String cargo;
    private String celular;
    private String area;
}