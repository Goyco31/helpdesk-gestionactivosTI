package helpdesk.backend.actas;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * Pruebas del cliente de Azure Blob Storage (cambio GC-11) contra el emulador Azurite.
 * Se omiten si no hay emulador. Para ejecutarlas:
 * <pre>
 *   npx azurite-blob --silent --blobPort 10000 --location ./azurite
 *   $env:AZURITE_CONNECTION_STRING="UseDevelopmentStorage=true"
 *   mvn -Dtest=AzureBlobClientTest test
 * </pre>
 */
class AzureBlobClientTest {

    // Cuenta y clave publicas del emulador (documentadas por Microsoft, no son secretos)
    private static final String AZURITE = "DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;"
            + "AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;"
            + "BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;";

    private static AzureBlobClient cliente;

    @BeforeAll
    static void conectar() {
        String cs = System.getenv("AZURITE_CONNECTION_STRING");
        assumeTrue(cs != null && !cs.isBlank(), "Sin emulador Azurite: se omiten las pruebas de Blob");
        cliente = new AzureBlobClient("UseDevelopmentStorage=true".equals(cs) ? AZURITE : cs,
                "actas-test-" + System.currentTimeMillis());
        cliente.crearContenedorPrivado();
    }

    @Test
    void subeDescargaYConservaLaHuella() {
        String ruta = "Actas 2026/11 - Noviembre/Hoja de préstamo - Cristhian Alva - ACT-000003.pdf";
        byte[] pdf = "%PDF-1.4 acta de prueba".getBytes(StandardCharsets.UTF_8);

        assertEquals(AzureBlobClient.Subida.CREADO, cliente.subirSiNoExiste(ruta, pdf, "application/pdf"));
        assertTrue(cliente.existe(ruta));
        assertEquals(Huella.sha256(pdf), Huella.sha256(cliente.descargar(ruta)));
    }

    @Test
    void nuncaSobrescribeUnActa() {
        String ruta = "Actas 2026/11 - Noviembre/ACT-000010.pdf";
        byte[] original = "original".getBytes(StandardCharsets.UTF_8);
        cliente.subirSiNoExiste(ruta, original, "application/pdf");

        assertEquals(AzureBlobClient.Subida.YA_EXISTE,
                cliente.subirSiNoExiste(ruta, "otro".getBytes(StandardCharsets.UTF_8), "application/pdf"));
        assertEquals(Huella.sha256(original), Huella.sha256(cliente.descargar(ruta)));
    }

    @Test
    void actaInexistenteDevuelve404() {
        AzureBlobClient.BlobException e = assertThrows(AzureBlobClient.BlobException.class,
                () -> cliente.descargar("no/existe.pdf"));
        assertEquals(404, e.getStatus());
        assertFalse(cliente.existe("no/existe.pdf"));
    }

    @Test
    void claveIncorrectaEsRechazada() {
        AzureBlobClient malo = new AzureBlobClient(AZURITE.replace("Eby8", "Xby8"), cliente.getContenedor());
        AzureBlobClient.BlobException e = assertThrows(AzureBlobClient.BlobException.class, malo::contenedorExiste);
        assertEquals(403, e.getStatus());
    }
}
