package helpdesk.backend.actas;

/**
 * Donde se guardan los PDF de las actas. La V1 usa una carpeta del servidor
 * ({@link CarpetaActaStorage}); al desplegar se puede cambiar por Azure Blob
 * Storage implementando esta misma interfaz, sin tocar el resto del codigo.
 */
public interface ActaStorage {

    /**
     * Guarda el archivo en la ruta relativa indicada. Nunca sobrescribe:
     * si el archivo ya existe lanza un error.
     *
     * @return la ruta relativa con la que se guardo (se registra en acta.url_pdf)
     */
    String guardar(String rutaRelativa, byte[] contenido);

    byte[] leer(String rutaRelativa);

    /** Solo para limpiar un archivo cuando la transaccion que lo creo se revierte. */
    void eliminarHuerfano(String rutaRelativa);
}
