package helpdesk.backend.controllers;

import helpdesk.backend.dtos.TicketRequest;
import helpdesk.backend.entities.Ticket;
import helpdesk.backend.services.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    // USUARIO ve solo sus tickets; SOPORTE y ADMIN ven todos
    @GetMapping
    public ResponseEntity<List<Ticket>> listar(Authentication auth) {
        return ResponseEntity.ok(ticketService.listarSegunRol(auth));
    }

    @PostMapping
    public ResponseEntity<Ticket> crear(@RequestBody TicketRequest request, Authentication auth) {
        // auth.getName() contiene el correo del usuario extraido del JWT
        Ticket nuevoTicket = ticketService.crearTicket(request, auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(nuevoTicket);
    }
}
