package helpdesk.backend.services;

import helpdesk.backend.dtos.MovimientoResponse;
import helpdesk.backend.entities.Acta;
import helpdesk.backend.entities.Activo;
import helpdesk.backend.entities.EstadoActivo;
import helpdesk.backend.entities.Movimiento;
import helpdesk.backend.entities.Ticket;
import helpdesk.backend.repositories.ActaRepository;
import helpdesk.backend.repositories.ActivoRepository;
import helpdesk.backend.repositories.MovimientoRepository;
import helpdesk.backend.repositories.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.TreeMap;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Reportes de inventario e indicadores (KPI) de la seccion 3.3 del informe,
 * calculados directamente desde los registros del sistema (observacion 4):
 *
 *  - Digitalizacion documental = movimientos con acta / movimientos que requieren acta x 100
 *  - TPEA (tiempo promedio de emision de acta) = promedio(acta.fecha_generacion - movimiento.fecha)
 *  - Actas firmadas = actas firmadas / actas emitidas x 100
 *  - Duplicidad en asignaciones = activos con mas de un colaborador vigente (0 por diseño:
 *    activo.usuario_actual_id es una sola columna) + inconsistencias estado/colaborador
 *  - Cumplimiento de SLA = tickets finalizados dentro del limite de su prioridad / finalizados x 100
 *  - MTTR por prioridad = promedio(fecha_finalizacion - fecha_creacion)
 *
 * Nota: los limites de SLA se miden en horas corridas; el informe los expresa en horas
 * habiles, por lo que el resultado es conservador (exige mas que el SLA real).
 */
@Service
@RequiredArgsConstructor
public class ReporteService {

    // Limite de resolucion por prioridad, en horas (seccion 3.3.2 del informe)
    private static final Map<String, Long> SLA_HORAS = Map.of(
            "Crítica", 4L, "Alta", 8L, "Media", 48L, "Baja", 120L);

    private final ActivoRepository activoRepository;
    private final MovimientoRepository movimientoRepository;
    private final TicketRepository ticketRepository;
    private final ActaRepository actaRepository;

    public record Conteo(String nombre, long cantidad) {}

    public record Kpi(String nombre, String valor, String meta, boolean cumple, String calculo) {}

    public record Resumen(
            String sede,
            int dias,
            LocalDateTime desde,
            Map<String, Long> inventario,     // total, asignados, disponibles, mantenimiento, ...
            List<Conteo> porCategoria,
            List<Conteo> porEstado,
            List<Conteo> porSede,
            Map<String, Long> tickets,        // por estado
            List<Kpi> kpis,
            List<MovimientoResponse> actividad
    ) {}

    @Transactional(readOnly = true)
    public Resumen resumen(String sede, int dias) {
        int periodo = dias <= 0 ? 30 : Math.min(dias, 3650);
        LocalDateTime desde = LocalDateTime.now().minusDays(periodo);
        String filtroSede = (sede == null || sede.isBlank() || sede.equalsIgnoreCase("todas")) ? null : sede.trim();

        // ---------------- Inventario (estado actual) ----------------
        List<Activo> activos = activoRepository.findAll().stream()
                .filter(a -> filtroSede == null || (a.getSede() != null && a.getSede().getNombre().equalsIgnoreCase(filtroSede)))
                .toList();
        List<Activo> vigentes = activos.stream()
                .filter(a -> !EstadoActivo.DE_BAJA.equals(a.getEstado().getNombre())).toList();

        Map<String, Long> inventario = new LinkedHashMap<>();
        inventario.put("total", (long) vigentes.size());
        inventario.put("asignados", contar(vigentes, EstadoActivo.EN_USO) + contar(vigentes, EstadoActivo.EN_PRESTAMO));
        inventario.put("disponibles", contar(vigentes, EstadoActivo.POR_ASIGNAR));
        inventario.put("mantenimiento", contar(vigentes, EstadoActivo.EN_MANTENIMIENTO));
        inventario.put("paraDonarOBaja", contar(vigentes, EstadoActivo.PARA_DONAR) + contar(vigentes, EstadoActivo.PARA_BAJA));
        inventario.put("deBaja", (long) (activos.size() - vigentes.size()));
        inventario.put("registradosEnPeriodo", vigentes.stream()
                .filter(a -> a.getFechaRegistro() != null && a.getFechaRegistro().isAfter(desde)).count());

        List<Conteo> porCategoria = agrupar(vigentes, a -> a.getCategoria().getNombre());
        List<Conteo> porEstado = agrupar(activos, a -> a.getEstado().getNombre());
        List<Conteo> porSede = agrupar(vigentes, a -> a.getSede() == null ? "Sin sede" : a.getSede().getNombre());

        // ---------------- Movimientos y actas del periodo ----------------
        List<Integer> idsActivos = activos.stream().map(Activo::getId).toList();
        List<Movimiento> movimientos = movimientoRepository.findAllByOrderByFechaDescIdDesc().stream()
                .filter(m -> m.getFecha().isAfter(desde))
                .filter(m -> filtroSede == null || idsActivos.contains(m.getActivo().getId()))
                .toList();
        List<Acta> actas = movimientos.stream().flatMap(m -> m.getActas().stream()).toList();

        // ---------------- Tickets del periodo ----------------
        List<Ticket> tickets = ticketRepository.findAll().stream()
                .filter(t -> t.getFechaCreacion() != null && t.getFechaCreacion().isAfter(desde))
                .toList();
        Map<String, Long> ticketsPorEstado = new LinkedHashMap<>();
        for (String e : List.of(Ticket.ABIERTO, Ticket.EN_PROCESO, Ticket.RESUELTO, Ticket.CERRADO)) {
            ticketsPorEstado.put(e, tickets.stream().filter(t -> e.equals(t.getEstado())).count());
        }

        List<Kpi> kpis = new ArrayList<>();
        kpis.add(kpiDigitalizacion(movimientos));
        kpis.add(kpiTpea(actas));
        kpis.add(kpiActasFirmadas(actas));
        kpis.add(kpiDuplicidad(vigentes));
        kpis.add(kpiSla(tickets));
        kpis.addAll(kpiMttr(tickets));

        List<MovimientoResponse> actividad = movimientos.stream().limit(10).map(MovimientoResponse::de).toList();

        return new Resumen(filtroSede == null ? "Todas" : filtroSede, periodo, desde, inventario,
                porCategoria, porEstado, porSede, ticketsPorEstado, kpis, actividad);
    }

    // ------------------------------------------------------------------

    private Kpi kpiDigitalizacion(List<Movimiento> movimientos) {
        List<Movimiento> requieren = movimientos.stream()
                .filter(m -> !Movimiento.CAMBIO_ESTADO.equals(m.getTipo())).toList();
        long conActa = requieren.stream().filter(m -> !m.getActas().isEmpty()).count();
        double pct = requieren.isEmpty() ? 100 : conActa * 100.0 / requieren.size();
        return new Kpi("Digitalización documental", pct(pct), "100 %", pct >= 100,
                conActa + " de " + requieren.size() + " movimientos con acta digital");
    }

    private Kpi kpiTpea(List<Acta> actas) {
        double segundos = actas.stream()
                .mapToLong(a -> Duration.between(a.getMovimiento().getFecha(), a.getFechaGeneracion()).toMillis())
                .average().orElse(0) / 1000.0;
        return new Kpi("Tiempo promedio de emisión de acta (TPEA)",
                actas.isEmpty() ? "—" : String.format("%.1f s", segundos), "≤ 3 min",
                actas.isEmpty() || segundos <= 180,
                "Promedio entre el registro del movimiento y la generación del acta (" + actas.size() + " actas)");
    }

    private Kpi kpiActasFirmadas(List<Acta> actas) {
        long firmadas = actas.stream().filter(a -> Acta.FIRMADA.equals(a.getEstado())).count();
        double pct = actas.isEmpty() ? 0 : firmadas * 100.0 / actas.size();
        return new Kpi("Actas firmadas electrónicamente", actas.isEmpty() ? "—" : pct(pct), "100 %",
                !actas.isEmpty() && pct >= 100, firmadas + " de " + actas.size() + " actas firmadas por el colaborador");
    }

    private Kpi kpiDuplicidad(List<Activo> vigentes) {
        // Asignado sin colaborador, o con colaborador sin estar asignado
        long inconsistentes = vigentes.stream().filter(a -> {
            boolean estadoAsignado = EstadoActivo.EN_USO.equals(a.getEstado().getNombre())
                    || EstadoActivo.EN_PRESTAMO.equals(a.getEstado().getNombre());
            return estadoAsignado != (a.getUsuarioActual() != null);
        }).count();
        long asignados = vigentes.stream().filter(a -> a.getUsuarioActual() != null).count();
        double pct = asignados == 0 ? 0 : inconsistentes * 100.0 / Math.max(asignados, 1);
        return new Kpi("Tasa de duplicidad en asignaciones", pct(pct), "0 %", inconsistentes == 0,
                "Un activo solo puede tener un colaborador (usuario_actual_id); inconsistencias: " + inconsistentes);
    }

    private Kpi kpiSla(List<Ticket> tickets) {
        List<Ticket> finalizados = tickets.stream().filter(t -> t.getFechaFinalizacion() != null).toList();
        long dentro = finalizados.stream().filter(t -> {
            Long limite = SLA_HORAS.get(t.getPrioridad());
            return limite != null && Duration.between(t.getFechaCreacion(), t.getFechaFinalizacion()).toMinutes() <= limite * 60;
        }).count();
        double pct = finalizados.isEmpty() ? 0 : dentro * 100.0 / finalizados.size();
        return new Kpi("Cumplimiento de SLA", finalizados.isEmpty() ? "—" : pct(pct), "≥ 95 %",
                !finalizados.isEmpty() && pct >= 95,
                dentro + " de " + finalizados.size() + " tickets resueltos dentro del tiempo de su prioridad");
    }

    private List<Kpi> kpiMttr(List<Ticket> tickets) {
        List<Kpi> lista = new ArrayList<>();
        Map<String, String> metas = Map.of("Alta", "≤ 8 h", "Media", "≤ 48 h", "Baja", "≤ 120 h");
        for (String prioridad : List.of("Alta", "Media", "Baja")) {
            List<Ticket> fin = tickets.stream()
                    .filter(t -> prioridad.equals(t.getPrioridad()) && t.getFechaFinalizacion() != null).toList();
            double horas = fin.stream()
                    .mapToLong(t -> Duration.between(t.getFechaCreacion(), t.getFechaFinalizacion()).toMinutes())
                    .average().orElse(0) / 60.0;
            lista.add(new Kpi("MTTR prioridad " + prioridad, fin.isEmpty() ? "—" : String.format("%.1f h", horas),
                    metas.get(prioridad), fin.isEmpty() || horas <= SLA_HORAS.get(prioridad),
                    "Promedio de resolución de " + fin.size() + " tickets"));
        }
        return lista;
    }

    private static long contar(List<Activo> activos, String estado) {
        return activos.stream().filter(a -> estado.equals(a.getEstado().getNombre())).count();
    }

    private static List<Conteo> agrupar(List<Activo> activos, Function<Activo, String> clave) {
        Map<String, Long> mapa = activos.stream()
                .map(clave).filter(Objects::nonNull)
                .collect(Collectors.groupingBy(Function.identity(), TreeMap::new, Collectors.counting()));
        return mapa.entrySet().stream()
                .map(e -> new Conteo(e.getKey(), e.getValue()))
                .sorted((x, y) -> Long.compare(y.cantidad(), x.cantidad()))
                .toList();
    }

    private static String pct(double v) {
        return String.format("%.1f %%", v);
    }
}
