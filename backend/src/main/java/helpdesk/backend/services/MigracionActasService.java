package helpdesk.backend.services;

import helpdesk.backend.actas.ActaPdfGenerator;
import helpdesk.backend.actas.ActaStorage;
import helpdesk.backend.actas.ActaStorageActivo;
import helpdesk.backend.actas.BlobActaStorage;
import helpdesk.backend.actas.CarpetaActaStorage;
import helpdesk.backend.actas.Huella;
import helpdesk.backend.dtos.MigracionActasResponse;
import helpdesk.backend.dtos.MigracionActasResponse.Archivo;
import helpdesk.backend.entities.Acta;
import helpdesk.backend.exceptions.ApiException;
import helpdesk.backend.repositories.ActaRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Copia los PDF de las actas entre la carpeta local y Azure Blob Storage
 * (cambio GC-11) y verifica cada archivo con su huella SHA-256.
 *
 * <ul>
 *   <li>{@code hacia=blob}: migracion (carpeta /home/actas a Blob).</li>
 *   <li>{@code hacia=local}: reversion (Blob a la carpeta), para volver a ACTA_STORAGE=local
 *       sin perder las actas generadas mientras Blob fue el almacenamiento principal.</li>
 * </ul>
 * Nunca borra ni sobrescribe: si el archivo ya existe en el destino solo compara su huella,
 * por lo que puede ejecutarse varias veces.
 */
@Service
public class MigracionActasService {

    private static final Logger log = LoggerFactory.getLogger(MigracionActasService.class);
    private static final Set<String> CORRECTOS = Set.of("COPIADA", "YA_EXISTIA_IGUAL");

    private final ActaRepository actaRepository;
    private final CarpetaActaStorage carpeta;
    private final BlobActaStorage blob;
    private final ActaStorageActivo activo;

    public MigracionActasService(ActaRepository actaRepository, CarpetaActaStorage carpeta,
                                 BlobActaStorage blob, ActaStorageActivo activo) {
        this.actaRepository = actaRepository;
        this.carpeta = carpeta;
        this.blob = blob;
        this.activo = activo;
    }

    public Map<String, Object> estado() {
        Map<String, Object> e = new LinkedHashMap<>();
        e.put("activo", activo.getTipo());
        e.put("descripcion", activo.getDescripcion());
        e.put("blobConfigurado", blob.configurado());
        e.put("blob", blob.descripcion());
        e.put("actasRegistradas", actaRepository.count());
        return e;
    }

    public MigracionActasResponse migrar(String hacia) {
        if (!blob.configurado()) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Blob Storage no está disponible: " + blob.motivoNoConfigurado());
        }
        String destinoTipo = hacia == null ? "" : hacia.trim().toLowerCase(Locale.ROOT);
        ActaStorage origen;
        ActaStorage destino;
        switch (destinoTipo) {
            case "blob" -> { origen = carpeta; destino = blob; }
            case "local" -> { origen = blob; destino = carpeta; }
            default -> throw new ApiException(HttpStatus.BAD_REQUEST, "El parámetro 'hacia' debe ser 'blob' o 'local'");
        }
        String nombreOrigen = destinoTipo.equals("blob") ? "local" : "blob";

        List<Archivo> detalle = new ArrayList<>();
        for (Acta acta : actaRepository.findAll(Sort.by("id"))) {
            if (acta.getUrlPdf() != null) {
                detalle.add(copiar(acta, "original", acta.getUrlPdf(), acta.getHashPdf(), origen, destino));
            }
            if (acta.getUrlPdfFirmado() != null) {
                detalle.add(copiar(acta, "firmado", acta.getUrlPdfFirmado(), acta.getHashPdfFirmado(), origen, destino));
            }
        }

        Map<String, Integer> totales = new LinkedHashMap<>();
        for (Archivo a : detalle) {
            totales.merge(a.resultado(), 1, Integer::sum);
        }
        boolean correcta = detalle.stream().allMatch(a -> CORRECTOS.contains(a.resultado()));
        log.info("Migracion de actas {} -> {}: {} archivos, {} ({})",
                nombreOrigen, destinoTipo, detalle.size(), correcta ? "CORRECTA" : "CON OBSERVACIONES", totales);
        return new MigracionActasResponse(nombreOrigen, destinoTipo, LocalDateTime.now(), correcta,
                detalle.size(), totales, detalle);
    }

    private Archivo copiar(Acta acta, String version, String ruta, String shaRegistrado,
                           ActaStorage origen, ActaStorage destino) {
        String codigo = ActaPdfGenerator.codigo(acta);
        String shaOrigen = null;
        String shaDestino = null;
        try {
            if (!origen.existe(ruta)) {
                return new Archivo(acta.getId(), codigo, version, ruta, shaRegistrado, null, null,
                        "FALTA_EN_ORIGEN", "El PDF no está en el almacenamiento de origen");
            }
            byte[] contenido = origen.leer(ruta);
            shaOrigen = Huella.sha256(contenido);
            if (shaRegistrado != null && !shaRegistrado.equalsIgnoreCase(shaOrigen)) {
                return new Archivo(acta.getId(), codigo, version, ruta, shaRegistrado, shaOrigen, null,
                        "HUELLA_NO_COINCIDE", "El PDF de origen no coincide con la huella registrada; no se copia");
            }
            if (destino.existe(ruta)) {
                shaDestino = Huella.sha256(destino.leer(ruta));
                boolean igual = shaDestino.equals(shaOrigen);
                return new Archivo(acta.getId(), codigo, version, ruta, shaRegistrado, shaOrigen, shaDestino,
                        igual ? "YA_EXISTIA_IGUAL" : "YA_EXISTIA_DISTINTA",
                        igual ? "Ya estaba en el destino con la misma huella" : "En el destino hay un archivo distinto; revisar");
            }
            destino.guardar(ruta, contenido);
            shaDestino = Huella.sha256(destino.leer(ruta)); // se vuelve a leer para comprobar lo guardado
            boolean igual = shaDestino.equals(shaOrigen);
            return new Archivo(acta.getId(), codigo, version, ruta, shaRegistrado, shaOrigen, shaDestino,
                    igual ? "COPIADA" : "ERROR",
                    igual ? (shaRegistrado == null ? "Copiada; el acta no tenía huella registrada" : "Copiada y verificada")
                          : "La huella del destino no coincide con la del origen");
        } catch (RuntimeException e) {
            log.error("Error al migrar {} ({})", ruta, version, e);
            return new Archivo(acta.getId(), codigo, version, ruta, shaRegistrado, shaOrigen, shaDestino,
                    "ERROR", e.getMessage());
        }
    }
}
