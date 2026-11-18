package helpdesk.backend.services;

import helpdesk.backend.dtos.MovimientoRequest;
import helpdesk.backend.entities.Activo;
import helpdesk.backend.entities.EstadoActivo;
import helpdesk.backend.entities.Ticket;
import helpdesk.backend.entities.Usuario;
import helpdesk.backend.exceptions.ApiException;
import helpdesk.backend.repositories.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Reglas de negocio de los movimientos (R1 a R5): si una falla, no se guarda nada
 * ni se genera el acta. Los repositorios se simulan con Mockito.
 */
@ExtendWith(MockitoExtension.class)
class MovimientoServiceTest {

    @Mock ActivoRepository activoRepository;
    @Mock TicketRepository ticketRepository;
    @Mock UsuarioRepository usuarioRepository;
    @Mock MovimientoRepository movimientoRepository;
    @Mock TicketActivoRepository ticketActivoRepository;
    @Mock ActivoService activoService;
    @Mock ActaService actaService;
    @InjectMocks MovimientoService service;

    static final String TECNICO = "soporte@terpel.pe";

    @Test
    @DisplayName("R1: un movimiento sin ticket se rechaza (400)")
    void sinTicket() {
        assertThatThrownBy(() -> service.asignar(req(1, null, 10), TECNICO))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST))
                .hasMessageContaining("ticket");
        sinCambios();
    }

    @Test
    @DisplayName("R1: un ticket Cerrado no admite movimientos (409)")
    void ticketCerrado() {
        when(ticketRepository.findById(5)).thenReturn(Optional.of(ticket(5, usuario(10), Ticket.CERRADO)));

        assertThatThrownBy(() -> service.asignar(req(1, 5, 10), TECNICO))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Abiertos o En Proceso");
        sinCambios();
    }

    @Test
    @DisplayName("R2: no se asigna un activo que ya está en uso (409)")
    void activoNoDisponible() {
        Usuario colaborador = usuario(10);
        when(ticketRepository.findById(5)).thenReturn(Optional.of(ticket(5, colaborador, Ticket.ABIERTO)));
        when(activoRepository.findByIdParaActualizar(1)).thenReturn(Optional.of(activo(1, EstadoActivo.EN_USO, usuario(20))));
        when(usuarioRepository.findByCorreo(TECNICO)).thenReturn(Optional.of(usuario(2)));
        when(usuarioRepository.findById(10)).thenReturn(Optional.of(colaborador));

        assertThatThrownBy(() -> service.asignar(req(1, 5, 10), TECNICO))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.CONFLICT))
                .hasMessageContaining("se requiere 'por asignar'");
        sinCambios();
    }

    @Test
    @DisplayName("R4: el ticket debe ser del colaborador que recibe el equipo (400)")
    void ticketDeOtroColaborador() {
        when(ticketRepository.findById(5)).thenReturn(Optional.of(ticket(5, usuario(30), Ticket.ABIERTO)));
        when(activoRepository.findByIdParaActualizar(1)).thenReturn(Optional.of(activo(1, EstadoActivo.POR_ASIGNAR, null)));
        when(usuarioRepository.findByCorreo(TECNICO)).thenReturn(Optional.of(usuario(2)));
        when(usuarioRepository.findById(10)).thenReturn(Optional.of(usuario(10)));

        assertThatThrownBy(() -> service.asignar(req(1, 5, 10), TECNICO))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("pertenece a");
        sinCambios();
    }

    @Test
    @DisplayName("R5: un activo de baja no admite movimientos (409)")
    void activoDeBaja() {
        when(ticketRepository.findById(5)).thenReturn(Optional.of(ticket(5, usuario(10), Ticket.ABIERTO)));
        when(activoRepository.findByIdParaActualizar(1)).thenReturn(Optional.of(activo(1, EstadoActivo.DE_BAJA, null)));

        assertThatThrownBy(() -> service.asignar(req(1, 5, 10), TECNICO))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("de baja");
        sinCambios();
    }

    @Test
    @DisplayName("R3: no se devuelve un activo que nadie tiene asignado (409)")
    void devolverActivoLibre() {
        when(ticketRepository.findById(5)).thenReturn(Optional.of(ticket(5, usuario(10), Ticket.ABIERTO)));
        when(activoRepository.findByIdParaActualizar(1)).thenReturn(Optional.of(activo(1, EstadoActivo.POR_ASIGNAR, null)));
        when(usuarioRepository.findByCorreo(TECNICO)).thenReturn(Optional.of(usuario(2)));

        assertThatThrownBy(() -> service.devolver(req(1, 5, null), TECNICO))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("no está asignado");
        sinCambios();
    }

    // ------------------------------------------------------------ utilidades

    /** Ninguna regla rota debe dejar rastro: ni activo, ni historial, ni acta. */
    private void sinCambios() {
        verify(activoRepository, never()).save(any());
        verify(movimientoRepository, never()).save(any());
        verifyNoInteractions(actaService);
    }

    private static MovimientoRequest req(Integer activoId, Integer ticketId, Integer destinoId) {
        return new MovimientoRequest(activoId, ticketId, destinoId, null, null, null);
    }

    private static Usuario usuario(int id) {
        Usuario u = new Usuario();
        u.setId(id);
        u.setNombres("Nombre" + id);
        u.setApellidos("Apellido" + id);
        u.setCorreo("u" + id + "@terpel.pe");
        return u;
    }

    private static Ticket ticket(int id, Usuario dueno, String estado) {
        Ticket t = new Ticket();
        t.setId(id);
        t.setUsuario(dueno);
        t.setEstado(estado);
        return t;
    }

    private static Activo activo(int id, String estado, Usuario actual) {
        EstadoActivo e = new EstadoActivo();
        e.setNombre(estado);
        Activo a = new Activo();
        a.setId(id);
        a.setCodigoPatrimonial("TI-000" + id);
        a.setEstado(e);
        a.setUsuarioActual(actual);
        return a;
    }
}
