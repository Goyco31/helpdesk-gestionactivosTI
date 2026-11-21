package helpdesk.backend.dtos;

import lombok.Data;

@Data
public class TicketRequest {
    private String asunto;
    private String descripcion;
    private String categoria;
    private String prioridad; // Baja, Media o Alta (SLA de la seccion 3.3.2)
    private String codigoSolicitud; // opcional: SOL-01 a SOL-06 (catalogo, seccion 8.1)
}