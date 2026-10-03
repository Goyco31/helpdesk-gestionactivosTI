package helpdesk.backend.controllers;

import helpdesk.backend.dtos.TicketRequest;
import helpdesk.backend.entities.Ticket;
import helpdesk.backend.services.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @GetMapping
    public ResponseEntity<List<Ticket>> listar() {
        return ResponseEntity.ok(ticketService.listarTodos());
    }

    @PostMapping
    public ResponseEntity<Ticket> crear(@RequestBody TicketRequest request, Principal principal) {
        // principal.getName() contiene el correo del usuario extraído del JWT
        Ticket nuevoTicket = ticketService.crearTicket(request, principal.getName());
        return ResponseEntity.ok(nuevoTicket);
    }
}