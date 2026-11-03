package helpdesk.backend.actas;

import helpdesk.backend.exceptions.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/**
 * Guarda las actas en un contenedor privado de Azure Blob Storage (cambio GC-11).
 * Usa las mismas rutas que la carpeta local, por ejemplo:
 * <pre>actas/Actas 2026/11 - Noviembre/Hoja de entrega - Jose Fernandez - 03-11-2026 - ACT-000045.pdf</pre>
 *
 * <p>Se configura con AZURE_STORAGE_CONNECTION_STRING (secreto del App Service)
 * y ACTAS_CONTAINER (por defecto "actas"). Si la cadena esta vacia, este
 * almacenamiento queda deshabilitado y el sistema sigue usando la carpeta local.
 */
@Component
public class BlobActaStorage implements ActaStorage {

    private static final Logger log = LoggerFactory.getLogger(BlobActaStorage.class);
    private static final String TIPO_PDF = "application/pdf";

    private final AzureBlobClient cliente; // null = no configurado

    public BlobActaStorage(@Value("${app.actas.blob.connection-string:}") String cadenaConexion,
                           @Value("${app.actas.blob.contenedor:actas}") String contenedor) {
        this.cliente = cadenaConexion == null || cadenaConexion.isBlank()
                ? null
                : new AzureBlobClient(cadenaConexion, contenedor);
    }

    public boolean configurado() {
        return cliente != null;
    }

    public String descripcion() {
        return configurado()
                ? "Azure Blob Storage (cuenta " + cliente.getCuenta() + ", contenedor " + cliente.getContenedor() + ")"
                : "Azure Blob Storage no configurado";
    }

    /** Comprueba credenciales y contenedor; se llama al arrancar cuando ACTA_STORAGE=blob. */
    public void verificarContenedor() {
        if (!cliente().contenedorExiste()) {
            throw new IllegalStateException("El contenedor '" + cliente.getContenedor()
                    + "' no existe en la cuenta " + cliente.getCuenta() + ". Créalo como privado en el portal de Azure.");
        }
    }

    @Override
    public String guardar(String rutaRelativa, byte[] contenido) {
        validar(rutaRelativa);
        try {
            AzureBlobClient.Subida r = cliente().subirSiNoExiste(rutaRelativa, contenido, TIPO_PDF);
            if (r == AzureBlobClient.Subida.YA_EXISTE) {
                throw new ApiException(HttpStatus.CONFLICT, "Ya existe un acta con el nombre " + nombreArchivo(rutaRelativa));
            }
            return rutaRelativa;
        } catch (AzureBlobClient.BlobException e) {
            throw traducir(e, "No se pudo guardar el PDF del acta en Azure Blob Storage");
        }
    }

    @Override
    public byte[] leer(String rutaRelativa) {
        validar(rutaRelativa);
        try {
            return cliente().descargar(rutaRelativa);
        } catch (AzureBlobClient.BlobException e) {
            if (e.getStatus() == 404) {
                throw new ApiException(HttpStatus.NOT_FOUND, "No se encuentra el archivo PDF del acta en Azure Blob Storage");
            }
            throw traducir(e, "No se pudo leer el PDF del acta desde Azure Blob Storage");
        }
    }

    @Override
    public boolean existe(String rutaRelativa) {
        validar(rutaRelativa);
        try {
            return cliente().existe(rutaRelativa);
        } catch (AzureBlobClient.BlobException e) {
            throw traducir(e, "No se pudo consultar el acta en Azure Blob Storage");
        }
    }

    @Override
    public void eliminarHuerfano(String rutaRelativa) {
        try {
            cliente().borrarSiExiste(rutaRelativa);
            log.warn("Se elimino el PDF {} de Azure Blob Storage porque su transaccion se revirtio", rutaRelativa);
        } catch (RuntimeException e) {
            log.error("No se pudo eliminar el PDF huerfano {} de Azure Blob Storage", rutaRelativa, e);
        }
    }

    private AzureBlobClient cliente() {
        if (cliente == null) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Azure Blob Storage no está configurado (falta AZURE_STORAGE_CONNECTION_STRING)");
        }
        return cliente;
    }

    // Misma proteccion que la carpeta local: ninguna ruta puede salir del contenedor
    private static void validar(String ruta) {
        if (ruta == null || ruta.isBlank() || ruta.startsWith("/") || ruta.contains("\\")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Ruta de acta inválida");
        }
        for (String parte : ruta.split("/")) {
            if (parte.isEmpty() || parte.equals(".") || parte.equals("..")) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Ruta de acta inválida");
            }
        }
    }

    private static String nombreArchivo(String ruta) {
        return ruta.substring(ruta.lastIndexOf('/') + 1);
    }

    private static ApiException traducir(AzureBlobClient.BlobException e, String mensaje) {
        log.error("{}: {}", mensaje, e.getMessage());
        HttpStatus status = e.getStatus() == 503 ? HttpStatus.SERVICE_UNAVAILABLE : HttpStatus.INTERNAL_SERVER_ERROR;
        return new ApiException(status, mensaje);
    }
}
