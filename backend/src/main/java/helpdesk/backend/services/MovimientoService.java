package helpdesk.backend.services;

import helpdesk.backend.dtos.MovimientoRequest;
import helpdesk.backend.dtos.MovimientoResponse;
import helpdesk.backend.entities.Activo;
import helpdesk.backend.entities.EstadoActivo;
import helpdesk.backend.entities.Movimiento;
import helpdesk.backend.entities.Ticket;
import helpdesk.backend.entities.TicketActivo;
import helpdesk.backend.entities.Usuario;
import helpdesk.backend.exceptions.ApiException;
import helpdesk.backend.repositories.ActivoRepository;
import helpdesk.backend.repositories.MovimientoRepository;
import helpdesk.backend.repositories.TicketActivoRepository;
import helpdesk.backend.repositories.TicketRepository;
import helpdesk.backend.repositories.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.Set;

/**
 * Logica de negocio de los movimientos de activos (RF05, RF06, RF09).
 *
 * Reglas que se validan ANTES de guardar nada (si una falla, no cambia nada):
 *  R1. Todo movimiento exige un ticket existente y vigente (Abierto o En Proceso).
 *  R2. Solo se asigna o presta un activo en estado "por asignar".
 *  R3. Solo se devuelve o reasigna un activo que realmente tiene un colaborador.
 *  R4. El ticket debe pertenecer al colaborador involucrado en el movimiento.
 *  R5. Un activo "de baja" es definitivo: no admite mas movimientos.
 *  R6. Cada movimiento queda en el historial (tabla movimiento, inalterable)
 *      y el activo se vincula al ticket (tabla ticket_activo).
 *  R7. Se genera automaticamente el acta en PDF (ver ActaService).
 *
 * La fila del activo se bloquea (SELECT ... FOR UPDATE) durante la
 * transaccion para que dos tecnicos no puedan asignar el mismo equipo a la vez.
 */
@Service
@RequiredArgsConstructor
public class MovimientoService {

    // Estados a los que puede volver un equipo al ser devuelto
    private static final Set<String> ESTADOS_POST_DEVOLUCION = Set.of(
            EstadoActivo.POR_ASIGNAR, EstadoActivo.EN_MANTENIMIENTO,
            EstadoActivo.PARA_DONAR, EstadoActivo.PARA_BAJA);

    // Estados que se pueden fijar manualmente a un equipo que esta en almacen
    private static final Set<String> ESTADOS_DE_ALMACEN = Set.of(
            EstadoActivo.POR_ASIGNAR, EstadoActivo.EN_MANTENIMIENTO,
            EstadoActivo.PARA_DONAR, EstadoActivo.PARA_BAJA, EstadoActivo.DE_BAJA);

    private static final Set<String> ESTADOS_CON_USUARIO = Set.of(
            EstadoActivo.EN_USO, EstadoActivo.EN_PRESTAMO);

    private final ActivoRepository activoRepository;
    private final TicketRepository ticketRepository;
    private final UsuarioRepository usuarioRepository;
    private final MovimientoRepository movimientoRepository;
    private final TicketActivoRepository ticketActivoRepository;
    private final ActivoService activoService;
    private final ActaService actaService;

    // ------------------------------------------------------------------
    // Operaciones
    // ------------------------------------------------------------------

    /** Entrega definitiva de un equipo a un colaborador. */
    @Transactional
    public MovimientoResponse asignar(MovimientoRequest req, String correoTecnico) {
        Contexto c = preparar(req, correoTecnico);
        Usuario destino = usuarioObligatorio(req.usuarioDestinoId(), "el colaborador que recibe el equipo");

        exigirEstado(c.activo, EstadoActivo.POR_ASIGNAR, "asignar");
        exigirTicketDe(c.ticket, destino);

        return registrar(c, Movimiento.ASIGNACION, null, destino, EstadoActivo.EN_USO, null, req.observacion());
    }

    /** Entrega temporal con fecha de devolucion prevista. */
    @Transactional
    public MovimientoResponse prestar(MovimientoRequest req, String correoTecnico) {
        Contexto c = preparar(req, correoTecnico);
        Usuario destino = usuarioObligatorio(req.usuarioDestinoId(), "el colaborador que recibe el préstamo");

        if (req.fechaDevolucionPrevista() == null || !req.fechaDevolucionPrevista().isAfter(LocalDate.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "El préstamo requiere una fecha de devolución prevista posterior a hoy");
        }
        exigirEstado(c.activo, EstadoActivo.POR_ASIGNAR, "prestar");
        exigirTicketDe(c.ticket, destino);

        return registrar(c, Movimiento.PRESTAMO, null, destino, EstadoActivo.EN_PRESTAMO,
                req.fechaDevolucionPrevista(), req.observacion());
    }

    /** El colaborador devuelve el equipo; vuelve al almacen en el estado indicado. */
    @Transactional
    public MovimientoResponse devolver(MovimientoRequest req, String correoTecnico) {
        Contexto c = preparar(req, correoTecnico);
        Usuario origen = exigirAsignado(c.activo, "devolver");

        String estadoDestino = (req.estadoDestino() == null || req.estadoDestino().isBlank())
                ? EstadoActivo.POR_ASIGNAR
                : req.estadoDestino().trim().toLowerCase();
        if (!ESTADOS_POST_DEVOLUCION.contains(estadoDestino)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Tras una devolución el equipo solo puede quedar: " + String.join(", ", ESTADOS_POST_DEVOLUCION));
        }
        exigirTicketDe(c.ticket, origen);

        return registrar(c, Movimiento.DEVOLUCION, origen, null, estadoDestino, null, req.observacion());
    }

    /** Traslada un equipo en uso de un colaborador a otro, sin pasar por almacen. */
    @Transactional
    public MovimientoResponse reasignar(MovimientoRequest req, String correoTecnico) {
        Contexto c = preparar(req, correoTecnico);
        exigirEstado(c.activo, EstadoActivo.EN_USO, "reasignar");
        Usuario origen = exigirAsignado(c.activo, "reasignar");
        Usuario destino = usuarioObligatorio(req.usuarioDestinoId(), "el nuevo colaborador");

        if (origen.getId().equals(destino.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "El equipo ya está asignado a " + destino.getNombreCompleto());
        }
        Integer duenoTicket = c.ticket.getUsuario().getId();
        if (!duenoTicket.equals(origen.getId()) && !duenoTicket.equals(destino.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "El ticket #" + c.ticket.getId()
                    + " no pertenece a ninguno de los colaboradores involucrados en la reasignación");
        }

        return registrar(c, Movimiento.REASIGNACION, origen, destino, EstadoActivo.EN_USO, null, req.observacion());
    }

    /** Cambia el estado de un equipo en almacen (mantenimiento, donar, baja...). */
    @Transactional
    public MovimientoResponse cambiarEstado(MovimientoRequest req, String correoTecnico) {
        Contexto c = preparar(req, correoTecnico);

        if (c.activo.getUsuarioActual() != null || ESTADOS_CON_USUARIO.contains(c.activo.getEstado().getNombre())) {
            throw new ApiException(HttpStatus.CONFLICT, "El activo " + c.activo.getCodigoPatrimonial()
                    + " está asignado; primero registra su devolución");
        }
        String estadoDestino = req.estadoDestino() == null ? "" : req.estadoDestino().trim().toLowerCase();
        if (!ESTADOS_DE_ALMACEN.contains(estadoDestino)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Estado no válido. Valores permitidos: " + String.join(", ", ESTADOS_DE_ALMACEN));
        }
        if (estadoDestino.equals(c.activo.getEstado().getNombre())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "El activo ya está en estado '" + estadoDestino + "'");
        }

        return registrar(c, Movimiento.CAMBIO_ESTADO, null, null, estadoDestino, null, req.observacion());
    }

    // ------------------------------------------------------------------
    // Consultas del historial (RF09)
    // ------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<MovimientoResponse> historialDeActivo(Integer activoId) {
        activoService.buscar(activoId); // 404 si no existe
        return movimientoRepository.findByActivoIdOrderByFechaDescIdDesc(activoId)
                .stream().map(MovimientoResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public List<MovimientoResponse> listar(Integer ticketId) {
        List<Movimiento> lista = ticketId == null
                ? movimientoRepository.findAllByOrderByFechaDescIdDesc()
                : movimientoRepository.findByTicketIdOrderByFechaDescIdDesc(ticketId);
        return lista.stream().map(MovimientoResponse::de).toList();
    }

    // ------------------------------------------------------------------
    // Validaciones comunes
    // ------------------------------------------------------------------

    private record Contexto(Activo activo, Ticket ticket, Usuario tecnico) {}

    private Contexto preparar(MovimientoRequest req, String correoTecnico) {
        if (req == null || req.activoId() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Falta el id del activo (activoId)");
        }
        Ticket ticket = ticketVigente(req.ticketId());

        // Bloquea la fila del activo hasta el final de la transaccion
        Activo activo = activoRepository.findByIdParaActualizar(req.activoId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No existe el activo " + req.activoId()));

        if (EstadoActivo.DE_BAJA.equals(activo.getEstado().getNombre())) {
            throw new ApiException(HttpStatus.CONFLICT, "El activo " + activo.getCodigoPatrimonial()
                    + " está de baja y no admite movimientos");
        }

        Usuario tecnico = usuarioRepository.findByCorreo(correoTecnico)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Usuario autenticado no encontrado"));
        return new Contexto(activo, ticket, tecnico);
    }

    // R1
    private Ticket ticketVigente(Integer ticketId) {
        if (ticketId == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Todo movimiento debe estar vinculado a un ticket (ticketId)");
        }
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No existe el ticket #" + ticketId));
        if (!Ticket.ABIERTO.equals(ticket.getEstado()) && !Ticket.EN_PROCESO.equals(ticket.getEstado())) {
            throw new ApiException(HttpStatus.CONFLICT, "El ticket #" + ticketId + " está " + ticket.getEstado()
                    + "; solo se registran movimientos con tickets Abiertos o En Proceso");
        }
        return ticket;
    }

    // R2
    private void exigirEstado(Activo activo, String estadoRequerido, String operacion) {
        String actual = activo.getEstado().getNombre();
        if (!estadoRequerido.equals(actual)) {
            String detalle = activo.getUsuarioActual() != null
                    ? " (lo tiene " + activo.getUsuarioActual().getNombreCompleto() + ")"
                    : "";
            throw new ApiException(HttpStatus.CONFLICT, "No se puede " + operacion + " el activo "
                    + activo.getCodigoPatrimonial() + ": su estado es '" + actual + "'" + detalle
                    + " y se requiere '" + estadoRequerido + "'");
        }
    }

    // R3
    private Usuario exigirAsignado(Activo activo, String operacion) {
        if (activo.getUsuarioActual() == null || !ESTADOS_CON_USUARIO.contains(activo.getEstado().getNombre())) {
            throw new ApiException(HttpStatus.CONFLICT, "No se puede " + operacion + " el activo "
                    + activo.getCodigoPatrimonial() + ": no está asignado a ningún colaborador (estado '"
                    + activo.getEstado().getNombre() + "')");
        }
        return activo.getUsuarioActual();
    }

    // R4
    private void exigirTicketDe(Ticket ticket, Usuario colaborador) {
        if (!Objects.equals(ticket.getUsuario().getId(), colaborador.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "El ticket #" + ticket.getId() + " pertenece a "
                    + ticket.getUsuario().getNombreCompleto() + ", no a " + colaborador.getNombreCompleto());
        }
    }

    private Usuario usuarioObligatorio(Integer id, String descripcion) {
        if (id == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Falta " + descripcion + " (usuarioDestinoId)");
        }
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No existe el usuario " + id));
    }

    // R6: aplica el cambio al activo y deja constancia en el historial
    private MovimientoResponse registrar(Contexto c, String tipo, Usuario origen, Usuario destino,
                                         String estadoNuevo, LocalDate fechaDevolucion, String observacion) {
        EstadoActivo anterior = c.activo.getEstado();
        EstadoActivo nuevo = activoService.estado(estadoNuevo);

        c.activo.setEstado(nuevo);
        c.activo.setUsuarioActual(destino); // null en devolucion y cambio de estado
        activoRepository.save(c.activo);

        Movimiento m = new Movimiento();
        m.setActivo(c.activo);
        m.setTicket(c.ticket);
        m.setTipo(tipo);
        m.setUsuarioOrigen(origen);
        m.setUsuarioDestino(destino);
        m.setEstadoAnterior(anterior);
        m.setEstadoNuevo(nuevo);
        m.setRegistradoPor(c.tecnico);
        m.setFechaDevolucionPrevista(fechaDevolucion);
        m.setObservacion(observacion == null || observacion.isBlank() ? null : observacion.trim());
        Movimiento guardado = movimientoRepository.save(m);

        // RF07: hoja de entrega / devolucion / prestamo en PDF, en la misma transaccion
        actaService.generarParaMovimiento(guardado);

        if (!ticketActivoRepository.existsByTicketIdAndActivoId(c.ticket.getId(), c.activo.getId())) {
            TicketActivo enlace = new TicketActivo();
            enlace.setTicket(c.ticket);
            enlace.setActivo(c.activo);
            ticketActivoRepository.save(enlace);
        }

        // El ticket pasa a "En Proceso" y queda a cargo del tecnico que registro el movimiento
        if (Ticket.ABIERTO.equals(c.ticket.getEstado())) {
            c.ticket.setEstado(Ticket.EN_PROCESO);
        }
        if (c.ticket.getTecnico() == null) {
            c.ticket.setTecnico(c.tecnico);
        }
        ticketRepository.save(c.ticket);

        return MovimientoResponse.de(guardado);
    }
}
