package helpdesk.backend.dtos;

/** Cambio de estado de un ticket: Abierto, En Proceso, Resuelto o Cerrado. */
public record TicketEstadoRequest(String estado) {}
