package helpdesk.backend.actas;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.util.Locale;

/**
 * Almacenamiento de actas que usa el sistema, elegido con la variable
 * ACTA_STORAGE (cambio GC-11):
 * <ul>
 *   <li>{@code local} (por defecto): carpeta ACTAS_DIR del servidor.</li>
 *   <li>{@code blob}: contenedor privado de Azure Blob Storage.</li>
 * </ul>
 * Revertir el cambio es volver a {@code local} y reiniciar la API.
 */
@Primary
@Component
public class ActaStorageActivo implements ActaStorage {

    private static final Logger log = LoggerFactory.getLogger(ActaStorageActivo.class);

    private final String tipo;
    private final ActaStorage delegado;
    private final String descripcion;

    public ActaStorageActivo(@Value("${app.actas.storage:local}") String tipo,
                             @Value("${app.actas.directorio}") String directorio,
                             CarpetaActaStorage carpeta,
                             BlobActaStorage blob) {
        this.tipo = tipo == null ? "local" : tipo.trim().toLowerCase(Locale.ROOT);
        switch (this.tipo) {
            case "local" -> {
                this.delegado = carpeta;
                this.descripcion = "Carpeta local " + directorio;
            }
            case "blob" -> {
                if (!blob.configurado()) {
                    throw new IllegalStateException(
                            "ACTA_STORAGE=blob requiere la variable AZURE_STORAGE_CONNECTION_STRING");
                }
                blob.verificarContenedor();
                this.delegado = blob;
                this.descripcion = blob.descripcion();
            }
            default -> throw new IllegalStateException(
                    "ACTA_STORAGE debe ser 'local' o 'blob' (valor recibido: '" + tipo + "')");
        }
        log.info("Almacenamiento de actas activo: {}", descripcion);
    }

    public String getTipo() {
        return tipo;
    }

    public String getDescripcion() {
        return descripcion;
    }

    @Override
    public String guardar(String rutaRelativa, byte[] contenido) {
        return delegado.guardar(rutaRelativa, contenido);
    }

    @Override
    public byte[] leer(String rutaRelativa) {
        return delegado.leer(rutaRelativa);
    }

    @Override
    public boolean existe(String rutaRelativa) {
        return delegado.existe(rutaRelativa);
    }

    @Override
    public void eliminarHuerfano(String rutaRelativa) {
        delegado.eliminarHuerfano(rutaRelativa);
    }
}
