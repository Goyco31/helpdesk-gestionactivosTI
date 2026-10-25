package helpdesk.backend.dtos;

import helpdesk.backend.entities.TicketComentario;

import java.time.LocalDateTime;

public record ComentarioDto(Integer id, Integer ticketId, String autor, String rolAutor, String texto, LocalDateTime fecha) {
    public static ComentarioDto de(TicketComentario c) {
        return new ComentarioDto(c.getId(), c.getTicket().getId(), c.getAutor().getNombreCompleto(),
                c.getAutor().getRol().getNombre(), c.getTexto(), c.getFecha());
    }

    /** Cuerpo para crear un comentario. */
    public record Nuevo(String texto) {}
}
