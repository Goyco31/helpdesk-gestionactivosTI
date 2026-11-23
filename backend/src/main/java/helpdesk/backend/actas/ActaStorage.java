package helpdesk.backend.actas;

/**
 * Donde se guardan los PDF de las actas. Hay dos implementaciones: la carpeta
 * del servidor ({@link CarpetaActaStorage}) y Azure Blob Storage
 * ({@link BlobActaStorage}, cambio GC-11). La variable ACTA_STORAGE elige cual
 * usa el sistema ({@link ActaStorageActivo}) sin tocar el resto del codigo.
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

    /** true si el archivo ya esta guardado (lo usa la migracion entre almacenamientos). */
    boolean existe(String rutaRelativa);

    /** Solo para limpiar un archivo cuando la transaccion que lo creo se revierte. */
    void eliminarHuerfano(String rutaRelativa);
}
