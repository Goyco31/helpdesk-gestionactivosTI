package helpdesk.backend.dtos;

import lombok.Data;

@Data
public class TicketRequest {
    private String asunto;
    private String categoria;
    private String prioridad; // Ej: Baja, Media, Alta, Crítica
}