package helpdesk.backend.controllers;

import helpdesk.backend.dtos.TicketEstadoRequest;
import helpdesk.backend.dtos.TicketRequest;
import helpdesk.backend.entities.Ticket;
import helpdesk.backend.services.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

    @GetMapping("/{id}")
    public ResponseEntity<Ticket> obtener(@PathVariable Integer id, Authentication auth) {
        return ResponseEntity.ok(ticketService.obtener(id, auth));
    }

    // RF10: solo Soporte y Admin cambian el estado del ticket
    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasAnyRole('ADMIN', 'SOPORTE')")
    public ResponseEntity<Ticket> actualizarEstado(@PathVariable Integer id,
                                                   @RequestBody TicketEstadoRequest request,
                                                   Authentication auth) {
        return ResponseEntity.ok(ticketService.actualizarEstado(id, request.estado(), auth.getName()));
    }

    @PostMapping
    public ResponseEntity<Ticket> crear(@RequestBody TicketRequest request, Authentication auth) {
        // auth.getName() contiene el correo del usuario extraido del JWT
        Ticket nuevoTicket = ticketService.crearTicket(request, auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(nuevoTicket);
    }
}
