package helpdesk.backend.entities;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "ticket_activo")
public class TicketActivo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    @ManyToOne
    @JoinColumn(name = "activo_id", nullable = false)
    private Activo activo;
}