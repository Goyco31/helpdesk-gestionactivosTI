package helpdesk.backend.dtos;

import lombok.Data;

@Data
public class TicketRequest {
    private String asunto;
    private String descripcion;
    private String categoria;
    private String prioridad; // Baja, Media o Alta (SLA de la seccion 3.3.2)
}