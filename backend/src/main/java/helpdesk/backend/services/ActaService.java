package helpdesk.backend.services;

import helpdesk.backend.actas.ActaPdfGenerator;
import helpdesk.backend.actas.ActaStorage;
import helpdesk.backend.dtos.ActaResponse;
import helpdesk.backend.entities.Acta;
import helpdesk.backend.entities.ActaDetalle;
import helpdesk.backend.entities.Activo;
import helpdesk.backend.entities.Movimiento;
import helpdesk.backend.entities.Usuario;
import helpdesk.backend.exceptions.ApiException;
import helpdesk.backend.repositories.ActaDetalleRepository;
import helpdesk.backend.repositories.ActaRepository;
import helpdesk.backend.repositories.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Actas digitales (RF07, RF08).
 *
 * Se generan automaticamente al registrar un movimiento, dentro de la misma
 * transaccion: si algo falla no queda ni el movimiento ni el acta, y el PDF
 * que ya se hubiera escrito se borra.
 *
 *   asignacion   -> Hoja de entrega   (colaborador que recibe)
 *   prestamo     -> Hoja de prestamo  (colaborador que recibe)
 *   devolucion   -> Hoja de devolucion (colaborador que devuelve)
 *   reasignacion -> Hoja de devolucion (anterior) + Hoja de entrega (nuevo)
 *   cambio_estado-> sin acta (el equipo no cambia de manos)
 *
 * Los PDF se guardan como:
 *   Actas 2026/10 - Octubre/Hoja de entrega - Jose Fernandez - 25-10-2026 - ACT-000045.pdf
 * El numero de acta es unico, asi que dos actas nunca tienen el mismo nombre.
 */
@Service
@RequiredArgsConstructor
public class ActaService {

    private static final Logger log = LoggerFactory.getLogger(ActaService.class);
    private static final Locale ES_PE = Locale.forLanguageTag("es-PE");
    private static final DateTimeFormatter FECHA_ARCHIVO = DateTimeFormatter.ofPattern("dd-MM-yyyy");

    private final ActaRepository actaRepository;
    private final ActaDetalleRepository detalleRepository;
    private final UsuarioRepository usuarioRepository;
    private final ActaPdfGenerator pdfGenerator;
    private final ActaStorage storage;

    // ------------------------------------------------------------------
    // Generacion (la llama MovimientoService dentro de su transaccion)
    // ------------------------------------------------------------------

    @Transactional
    public List<Acta> generarParaMovimiento(Movimiento m) {
        List<Acta> actas = new ArrayList<>();
        switch (m.getTipo()) {
            case Movimiento.ASIGNACION -> actas.add(crear(m, Acta.ENTREGA, m.getUsuarioDestino()));
            case Movimiento.PRESTAMO -> actas.add(crear(m, Acta.PRESTAMO, m.getUsuarioDestino()));
            case Movimiento.DEVOLUCION -> actas.add(crear(m, Acta.DEVOLUCION, m.getUsuarioOrigen()));
            case Movimiento.REASIGNACION -> {
                actas.add(crear(m, Acta.DEVOLUCION, m.getUsuarioOrigen()));
                actas.add(crear(m, Acta.ENTREGA, m.getUsuarioDestino()));
            }
            default -> { /* cambio_estado: no genera acta */ }
        }
        m.getActas().addAll(actas);
        return actas;
    }

    private Acta crear(Movimiento m, String tipo, Usuario colaborador) {
        long inicio = System.nanoTime();

        Acta acta = new Acta();
        acta.setTicket(m.getTicket());
        acta.setUsuario(colaborador);
        acta.setMovimiento(m);
        acta.setTipoActa(tipo);
        acta.setFechaGeneracion(LocalDateTime.now());
        acta.setEstado(Acta.PENDIENTE_FIRMA);
        acta = actaRepository.saveAndFlush(acta); // se necesita el id para el numero ACT-xxxxxx

        // "Foto" del equipo en este momento
        Activo activo = m.getActivo();
        ActaDetalle detalle = new ActaDetalle();
        detalle.setActa(acta);
        detalle.setActivo(activo);
        detalle.setMarca(activo.getMarca());
        detalle.setModelo(activo.getModelo());
        detalle.setNumeroSerie(activo.getNumeroSerie());
        detalleRepository.save(detalle);

        byte[] pdf = pdfGenerator.generar(acta, List.of(detalle));
        String ruta = storage.guardar(rutaArchivo(acta, colaborador), pdf);
        borrarSiSeRevierte(ruta);

        acta.setUrlPdf(ruta);
        acta = actaRepository.save(acta);

        // Esta linea en el log alimenta el KPI "Tiempo de generacion de actas" (meta <= 3 s, RNF03)
        long ms = (System.nanoTime() - inicio) / 1_000_000;
        log.info("Acta {} generada en {} ms ({} KB): {}", ActaPdfGenerator.codigo(acta), ms, pdf.length / 1024, ruta);
        return acta;
    }

    /** Actas {año}/{mm - Mes}/{Tipo} - {Nombre Apellido} - {dd-MM-yyyy} - ACT-000045.pdf */
    static String rutaArchivo(Acta acta, Usuario colaborador) {
        LocalDateTime f = acta.getFechaGeneracion();
        String mes = f.getMonth().getDisplayName(TextStyle.FULL, ES_PE);
        mes = mes.substring(0, 1).toUpperCase(ES_PE) + mes.substring(1);

        String prefijo = switch (acta.getTipoActa()) {
            case Acta.DEVOLUCION -> "Hoja de devolucion";
            case Acta.PRESTAMO -> "Hoja de prestamo";
            default -> "Hoja de entrega";
        };
        String archivo = String.format("%s - %s - %s - %s.pdf",
                prefijo, limpiar(colaborador.getNombreCorto()), f.format(FECHA_ARCHIVO), ActaPdfGenerator.codigo(acta));

        return String.format("Actas %d/%02d - %s/%s", f.getYear(), f.getMonthValue(), mes, archivo);
    }

    // Quita caracteres que Windows no admite en nombres de archivo
    private static String limpiar(String s) {
        String limpio = s == null ? "" : s.replaceAll("[\\\\/:*?\"<>|]", "").replaceAll("\\s+", " ").trim();
        return limpio.isEmpty() ? "Sin nombre" : limpio;
    }

    private void borrarSiSeRevierte(String ruta) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCompletion(int status) {
                    if (status == STATUS_ROLLED_BACK) {
                        storage.eliminarHuerfano(ruta);
                    }
                }
            });
        }
    }

    // ------------------------------------------------------------------
    // Consultas y descarga
    // ------------------------------------------------------------------

    /** Soporte/Admin ven todas; un colaborador solo las suyas. */
    @Transactional(readOnly = true)
    public List<ActaResponse> listar(Authentication auth, Integer ticketId) {
        List<Acta> actas;
        if (esPersonalTI(auth)) {
            actas = ticketId == null ? actaRepository.findAllByOrderByIdDesc()
                    : actaRepository.findByTicketIdOrderByIdDesc(ticketId);
        } else {
            actas = actaRepository.findByUsuarioIdOrderByIdDesc(usuario(auth).getId());
        }
        return actas.stream().map(this::respuesta).toList();
    }

    @Transactional(readOnly = true)
    public ActaResponse obtener(Integer id, Authentication auth) {
        return respuesta(buscarConAcceso(id, auth));
    }

    public record ArchivoActa(String nombre, byte[] contenido) {}

    @Transactional(readOnly = true)
    public ArchivoActa descargar(Integer id, Authentication auth) {
        Acta acta = buscarConAcceso(id, auth);
        if (acta.getUrlPdf() == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "El acta no tiene PDF generado");
        }
        String nombre = acta.getUrlPdf().substring(acta.getUrlPdf().lastIndexOf('/') + 1);
        return new ArchivoActa(nombre, storage.leer(acta.getUrlPdf()));
    }

    private Acta buscarConAcceso(Integer id, Authentication auth) {
        Acta acta = actaRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No existe el acta " + id));
        if (!esPersonalTI(auth) && !acta.getUsuario().getId().equals(usuario(auth).getId())) {
            // 404 en lugar de 403 para no revelar que el acta existe
            throw new ApiException(HttpStatus.NOT_FOUND, "No existe el acta " + id);
        }
        return acta;
    }

    private ActaResponse respuesta(Acta a) {
        return ActaResponse.de(a, detalleRepository.findByActaIdOrderById(a.getId()));
    }

    private Usuario usuario(Authentication auth) {
        return usuarioRepository.findByCorreo(auth.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));
    }

    private static boolean esPersonalTI(Authentication auth) {
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(r -> r.equals("ROLE_ADMIN") || r.equals("ROLE_SOPORTE"));
    }
}
