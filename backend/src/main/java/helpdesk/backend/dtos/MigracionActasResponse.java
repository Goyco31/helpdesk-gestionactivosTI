package helpdesk.backend.dtos;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Reporte de la migracion de actas entre almacenamientos (cambio GC-11).
 * Es la evidencia de que cada PDF llego intacto: SHA-256 de origen, destino
 * y el registrado en la tabla acta.
 */
public record MigracionActasResponse(
        String origen,
        String destino,
        LocalDateTime fecha,
        boolean correcta,
        int archivos,
        Map<String, Integer> totales,
        List<Archivo> detalle) {

    /**
     * Resultado por archivo:
     * COPIADA, YA_EXISTIA_IGUAL, YA_EXISTIA_DISTINTA, FALTA_EN_ORIGEN,
     * HUELLA_NO_COINCIDE (el archivo de origen no coincide con la huella registrada) o ERROR.
     */
    public record Archivo(
            Integer actaId,
            String codigo,
            String version,       // "original" o "firmado"
            String ruta,
            String shaRegistrado, // acta.hash_pdf / acta.hash_pdf_firmado (puede ser null en actas antiguas)
            String shaOrigen,
            String shaDestino,
            String resultado,
            String observacion) {
    }
}
