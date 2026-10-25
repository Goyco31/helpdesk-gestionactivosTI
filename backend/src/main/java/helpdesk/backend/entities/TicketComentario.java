package helpdesk.backend.entities;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/** Comentario de seguimiento o resolucion de un ticket (inalterable). */
@Data
@Entity
@Table(name = "ticket_comentario")
public class TicketComentario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "ticket_id", nullable = false, updatable = false)
    private Ticket ticket;

    @ManyToOne(optional = false)
    @JoinColumn(name = "autor_id", nullable = false, updatable = false)
    private Usuario autor;

    @Column(nullable = false, length = 1000, updatable = false)
    private String texto;

    @Column(nullable = false, updatable = false)
    private LocalDateTime fecha = LocalDateTime.now();
}
