package helpdesk.backend.actas;

import helpdesk.backend.exceptions.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.FileAlreadyExistsException;
import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;

/**
 * Guarda las actas en una carpeta local:
 * <pre>
 * {ACTAS_DIR}/Actas 2026/10 - Octubre/Hoja de entrega - Jose Fernandez - 25-10-2026 - ACT-000045.pdf
 * </pre>
 */
@Component
public class CarpetaActaStorage implements ActaStorage {

    private static final Logger log = LoggerFactory.getLogger(CarpetaActaStorage.class);

    private final Path base;

    public CarpetaActaStorage(@Value("${app.actas.directorio}") String directorio) throws IOException {
        this.base = Path.of(directorio).toAbsolutePath().normalize();
        Files.createDirectories(base);
        log.info("Las actas PDF se guardan en: {}", base);
    }

    @Override
    public String guardar(String rutaRelativa, byte[] contenido) {
        Path destino = resolver(rutaRelativa);
        try {
            Files.createDirectories(destino.getParent());
            // CREATE_NEW: falla si el archivo ya existe, asi nunca se sobrescribe un acta emitida
            Files.write(destino, contenido, StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE);
            return rutaRelativa;
        } catch (FileAlreadyExistsException e) {
            throw new ApiException(HttpStatus.CONFLICT, "Ya existe un acta con el nombre " + destino.getFileName());
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo guardar el PDF del acta: " + e.getMessage());
        }
    }

    @Override
    public byte[] leer(String rutaRelativa) {
        try {
            return Files.readAllBytes(resolver(rutaRelativa));
        } catch (NoSuchFileException e) {
            throw new ApiException(HttpStatus.NOT_FOUND, "No se encuentra el archivo PDF del acta en el servidor");
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo leer el PDF del acta: " + e.getMessage());
        }
    }

    @Override
    public void eliminarHuerfano(String rutaRelativa) {
        try {
            Files.deleteIfExists(resolver(rutaRelativa));
            log.warn("Se elimino el PDF {} porque su transaccion se revirtio", rutaRelativa);
        } catch (IOException e) {
            log.error("No se pudo eliminar el PDF huerfano {}", rutaRelativa, e);
        }
    }

    // Evita que una ruta con ".." escriba o lea fuera de la carpeta de actas
    private Path resolver(String rutaRelativa) {
        Path destino = base.resolve(rutaRelativa).normalize();
        if (!destino.startsWith(base)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Ruta de acta inválida");
        }
        return destino;
    }
}
