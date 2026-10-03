package helpdesk.backend.dtos;

import lombok.Data;

@Data
public class Verify2faRequest {
    private String correo;
    private String codigo;
}