package helpdesk.backend.services;

import helpdesk.backend.dtos.TicketRequest;
import helpdesk.backend.entities.Ticket;
import helpdesk.backend.entities.TicketComentario;
import helpdesk.backend.entities.Usuario;
import helpdesk.backend.exceptions.ApiException;
import helpdesk.backend.repositories.TicketComentarioRepository;
import helpdesk.backend.repositories.TicketRepository;
import helpdesk.backend.repositories.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
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
 * Reglas de tickets sin base de datos (los repositorios se simulan con Mockito).
 * Incluye la prueba de rechazo del control de aprobacion de accesos privilegiados (seccion 8.1.4).
 */
@ExtendWith(MockitoExtension.class)
class TicketServiceTest {

    @Mock TicketRepository ticketRepository;
    @Mock UsuarioRepository usuarioRepository;
    @Mock TicketComentarioRepository comentarioRepository;
    @InjectMocks TicketService service;

    Usuario colaborador;
    Usuario admin;

    @BeforeEach
    void datos() {
        colaborador = usuario(10, "colaborador@terpel.pe");
        admin = usuario(1, "jefatura.ti@terpel.pe");
    }

    // ------------------------------------------------------------ aprobacion (8.1.4)

    @Test
    @DisplayName("AP-01: un SOL-05 sin aprobación NO puede pasar a En Proceso (409)")
    void accesoPrivilegiadoSinAprobacionSeRechaza() {
        Ticket t = ticket(3, "SOL-05", Ticket.ABIERTO);
        when(ticketRepository.findById(3)).thenReturn(Optional.of(t));

        assertThatThrownBy(() -> service.actualizarEstado(3, Ticket.EN_PROCESO, "soporte@terpel.pe"))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.CONFLICT))
                .hasMessageContaining("registre la aprobación");
        assertThat(t.getEstado()).isEqualTo(Ticket.ABIERTO);
        verify(ticketRepository, never()).save(any());
    }

    @Test
    @DisplayName("AP-02: un SOL-04 sin aprobación tampoco puede cerrarse directamente")
    void accesoPrivilegiadoNoSeCierraSinAprobacion() {
        when(ticketRepository.findById(4)).thenReturn(Optional.of(ticket(4, "SOL-04", Ticket.ABIERTO)));

        assertThatThrownBy(() -> service.actualizarEstado(4, Ticket.CERRADO, "soporte@terpel.pe"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("SOL-04");
    }

    @Test
    @DisplayName("AP-03: con la aprobación registrada, el SOL-05 sí avanza a En Proceso")
    void conAprobacionAvanza() {
        Ticket t = ticket(3, "SOL-05", Ticket.ABIERTO);
        when(ticketRepository.findById(3)).thenReturn(Optional.of(t));
        when(usuarioRepository.findByCorreo(admin.getCorreo())).thenReturn(Optional.of(admin));
        when(ticketRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        service.registrarAprobacion(3, "Correo de la Jefatura de TI del 05/11/2026", admin.getCorreo());
        Ticket resultado = service.actualizarEstado(3, Ticket.EN_PROCESO, admin.getCorreo());

        assertThat(resultado.getEstado()).isEqualTo(Ticket.EN_PROCESO);
        assertThat(resultado.getAprobadoPor()).isEqualTo(admin);
        assertThat(resultado.getFechaAprobacion()).isNotNull();
        verify(comentarioRepository).save(any(TicketComentario.class)); // queda en la actividad del ticket
    }

    @Test
    @DisplayName("AP-04: la aprobación exige evidencia")
    void aprobacionSinEvidenciaSeRechaza() {
        when(ticketRepository.findById(3)).thenReturn(Optional.of(ticket(3, "SOL-05", Ticket.ABIERTO)));

        assertThatThrownBy(() -> service.registrarAprobacion(3, "  ", admin.getCorreo()))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("evidencia");
    }

    @Test
    @DisplayName("AP-05: una solicitud de información (SOL-01) no requiere aprobación y avanza")
    void solicitudDeInformacionAvanzaSinAprobacion() {
        Ticket t = ticket(2, "SOL-01", Ticket.ABIERTO);
        when(ticketRepository.findById(2)).thenReturn(Optional.of(t));
        when(ticketRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        assertThat(service.actualizarEstado(2, Ticket.EN_PROCESO, "soporte@terpel.pe").getEstado())
                .isEqualTo(Ticket.EN_PROCESO);
        assertThatThrownBy(() -> service.registrarAprobacion(2, "Correo de aprobación", admin.getCorreo()))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("no requiere aprobación");
    }

    // ------------------------------------------------------------ creacion y estados

    @Test
    @DisplayName("TK-01: rechaza un código de solicitud fuera del catálogo")
    void codigoDeSolicitudInvalido() {
        when(usuarioRepository.findByCorreo(colaborador.getCorreo())).thenReturn(Optional.of(colaborador));
        TicketRequest r = request("SOL-09");

        assertThatThrownBy(() -> service.crearTicket(r, colaborador.getCorreo()))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("SOL-01 a SOL-06");
    }

    @Test
    @DisplayName("TK-02: un ticket nuevo queda Abierto con su código de catálogo")
    void ticketNuevoQuedaAbierto() {
        when(usuarioRepository.findByCorreo(colaborador.getCorreo())).thenReturn(Optional.of(colaborador));
        when(ticketRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        Ticket t = service.crearTicket(request("sol-05"), colaborador.getCorreo());

        assertThat(t.getEstado()).isEqualTo(Ticket.ABIERTO);
        assertThat(t.getCodigoSolicitud()).isEqualTo("SOL-05");
        assertThat(t.isRequiereAprobacion()).isTrue();
    }

    @Test
    @DisplayName("TK-03: rechaza una prioridad fuera del SLA")
    void prioridadInvalida() {
        when(usuarioRepository.findByCorreo(colaborador.getCorreo())).thenReturn(Optional.of(colaborador));
        TicketRequest r = request(null);
        r.setPrioridad("Crítica");

        assertThatThrownBy(() -> service.crearTicket(r, colaborador.getCorreo()))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Prioridad no válida");
    }

    @Test
    @DisplayName("TK-04: un ticket Cerrado no puede modificarse")
    void ticketCerradoNoSeModifica() {
        when(ticketRepository.findById(7)).thenReturn(Optional.of(ticket(7, null, Ticket.CERRADO)));

        assertThatThrownBy(() -> service.actualizarEstado(7, Ticket.ABIERTO, "soporte@terpel.pe"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Cerrado");
    }

    @Test
    @DisplayName("TK-05: al resolver se registra la fecha de finalización (KPI de SLA)")
    void resolverRegistraFechaFinalizacion() {
        Ticket t = ticket(8, null, Ticket.EN_PROCESO);
        when(ticketRepository.findById(8)).thenReturn(Optional.of(t));
        when(ticketRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        assertThat(service.actualizarEstado(8, Ticket.RESUELTO, "soporte@terpel.pe").getFechaFinalizacion())
                .isNotNull();
    }

    // ------------------------------------------------------------ utilidades

    private static Usuario usuario(int id, String correo) {
        Usuario u = new Usuario();
        u.setId(id);
        u.setCorreo(correo);
        u.setNombres("Nombre" + id);
        u.setApellidos("Apellido" + id);
        return u;
    }

    private Ticket ticket(int id, String codigo, String estado) {
        Ticket t = new Ticket();
        t.setId(id);
        t.setUsuario(colaborador);
        t.setAsunto("Prueba");
        t.setCategoria("Aplicaciones");
        t.setPrioridad("Media");
        t.setEstado(estado);
        t.setCodigoSolicitud(codigo);
        return t;
    }

    private static TicketRequest request(String codigo) {
        TicketRequest r = new TicketRequest();
        r.setAsunto("Alta de usuario en el Helpdesk");
        r.setCategoria("Aplicaciones");
        r.setPrioridad("Alta");
        r.setCodigoSolicitud(codigo);
        return r;
    }
}
