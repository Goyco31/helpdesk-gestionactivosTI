package helpdesk.backend.actas;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;

/**
 * Cliente minimo de Azure Blob Storage (API REST, autenticacion Shared Key)
 * escrito solo con el JDK, para no agregar dependencias al proyecto.
 *
 * <p>Solo implementa lo que necesitan las actas: subir sin sobrescribir,
 * descargar, comprobar si existe, borrar y verificar el contenedor.
 * Se configura con la cadena de conexion de la cuenta de almacenamiento:
 * <pre>DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net</pre>
 * Tambien acepta {@code BlobEndpoint=...} (por ejemplo, el emulador Azurite).
 *
 * <p>No depende de Spring: se puede probar por separado contra Azurite.
 */
public class AzureBlobClient {

    /** Version de la API REST de Blob usada en todas las solicitudes. */
    static final String VERSION_API = "2021-08-06";

    private static final DateTimeFormatter RFC_1123 =
            DateTimeFormatter.ofPattern("EEE, dd MMM yyyy HH:mm:ss 'GMT'", Locale.US);

    private final String cuenta;
    private final byte[] clave;
    private final String endpoint;   // https://cuenta.blob.core.windows.net (sin "/" final)
    private final String contenedor;
    private final HttpClient http;

    /** Resultado de una subida. */
    public enum Subida { CREADO, YA_EXISTE }

    /** Error de Azure con su codigo HTTP y el codigo de error de Azure (x-ms-error-code). */
    public static class BlobException extends RuntimeException {
        private final int status;

        public BlobException(int status, String mensaje) {
            super(mensaje);
            this.status = status;
        }

        public int getStatus() {
            return status;
        }
    }

    public AzureBlobClient(String cadenaConexion, String contenedor) {
        Map<String, String> p = parsear(cadenaConexion);
        this.cuenta = requerido(p, "AccountName");
        this.clave = Base64.getDecoder().decode(requerido(p, "AccountKey"));
        String blobEndpoint = p.get("BlobEndpoint");
        if (blobEndpoint == null) {
            String protocolo = p.getOrDefault("DefaultEndpointsProtocol", "https");
            String sufijo = p.getOrDefault("EndpointSuffix", "core.windows.net");
            blobEndpoint = protocolo + "://" + cuenta + ".blob." + sufijo;
        }
        this.endpoint = blobEndpoint.replaceAll("/+$", "");
        this.contenedor = contenedor;
        this.http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    }

    public String getCuenta() {
        return cuenta;
    }

    public String getContenedor() {
        return contenedor;
    }

    /** true si el contenedor existe y las credenciales son validas. */
    public boolean contenedorExiste() {
        HttpResponse<byte[]> r = enviar("GET", "", "restype=container", null, Map.of());
        if (r.statusCode() == 200) return true;
        if (r.statusCode() == 404) return false;
        throw error(r, "No se pudo consultar el contenedor " + contenedor);
    }

    /** Crea el contenedor privado (sin acceso anonimo). Lo usan las pruebas contra Azurite. */
    boolean crearContenedorPrivado() {
        HttpResponse<byte[]> r = enviar("PUT", "", "restype=container", null, Map.of());
        if (r.statusCode() == 201) return true;
        if (r.statusCode() == 409) return false;
        throw error(r, "No se pudo crear el contenedor " + contenedor);
    }

    /**
     * Sube el archivo SOLO si no existe (cabecera If-None-Match: *), asi un
     * acta emitida nunca se sobrescribe.
     */
    public Subida subirSiNoExiste(String nombre, byte[] contenido, String tipoContenido) {
        Map<String, String> h = new HashMap<>();
        h.put("x-ms-blob-type", "BlockBlob");
        h.put("Content-Type", tipoContenido);
        h.put("If-None-Match", "*");
        HttpResponse<byte[]> r = enviar("PUT", nombre, null, contenido, h);
        if (r.statusCode() == 201) return Subida.CREADO;
        if (r.statusCode() == 409 || r.statusCode() == 412) return Subida.YA_EXISTE;
        throw error(r, "No se pudo subir " + nombre);
    }

    /** Descarga el archivo; lanza BlobException con status 404 si no existe. */
    public byte[] descargar(String nombre) {
        HttpResponse<byte[]> r = enviar("GET", nombre, null, null, Map.of());
        if (r.statusCode() == 200) return r.body();
        throw error(r, "No se pudo descargar " + nombre);
    }

    public boolean existe(String nombre) {
        HttpResponse<byte[]> r = enviar("HEAD", nombre, null, null, Map.of());
        if (r.statusCode() == 200) return true;
        if (r.statusCode() == 404) return false;
        throw error(r, "No se pudo consultar " + nombre);
    }

    /** Borra el archivo si existe (con eliminacion temporal activada, Azure conserva una copia). */
    public boolean borrarSiExiste(String nombre) {
        HttpResponse<byte[]> r = enviar("DELETE", nombre, null, null, Map.of());
        if (r.statusCode() == 202) return true;
        if (r.statusCode() == 404) return false;
        throw error(r, "No se pudo borrar " + nombre);
    }

    // ------------------------------------------------------------------
    // Solicitud firmada con Shared Key
    // https://learn.microsoft.com/rest/api/storageservices/authorize-with-shared-key
    // ------------------------------------------------------------------

    private HttpResponse<byte[]> enviar(String verbo, String nombre, String consulta, byte[] cuerpo,
                                        Map<String, String> cabeceras) {
        String rutaUri = URI.create(endpoint).getRawPath() + "/" + codificar(contenedor)
                + (nombre.isEmpty() ? "" : "/" + codificarRuta(nombre));
        String url = URI.create(endpoint).resolve(rutaUri).toString() + (consulta != null ? "?" + consulta : "");

        Map<String, String> h = new HashMap<>(cabeceras);
        h.put("x-ms-date", RFC_1123.format(ZonedDateTime.now(ZoneOffset.UTC)));
        h.put("x-ms-version", VERSION_API);
        long largo = cuerpo == null ? 0 : cuerpo.length;

        String firma = firmar(verbo, rutaUri, consulta, largo, h);
        HttpRequest.Builder b = HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(60))
                .header("Authorization", "SharedKey " + cuenta + ":" + firma);
        h.forEach(b::header);
        HttpRequest.BodyPublisher body = cuerpo == null
                ? HttpRequest.BodyPublishers.noBody()
                : HttpRequest.BodyPublishers.ofByteArray(cuerpo);
        b.method(verbo, body);
        try {
            return http.send(b.build(), HttpResponse.BodyHandlers.ofByteArray());
        } catch (IOException e) {
            throw new BlobException(503, "No se pudo conectar con Azure Blob Storage: " + e.getMessage());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BlobException(503, "Conexion con Azure Blob Storage interrumpida");
        }
    }

    String firmar(String verbo, String rutaUri, String consulta, long largo, Map<String, String> h) {
        // Cabeceras estandar en el orden que exige Azure (vacias si no se envian)
        String cadena = String.join("\n",
                verbo,
                valor(h, "Content-Encoding"),
                valor(h, "Content-Language"),
                largo > 0 ? Long.toString(largo) : "",
                valor(h, "Content-MD5"),
                valor(h, "Content-Type"),
                "",                                   // Date (se usa x-ms-date)
                valor(h, "If-Modified-Since"),
                valor(h, "If-Match"),
                valor(h, "If-None-Match"),
                valor(h, "If-Unmodified-Since"),
                valor(h, "Range"))
                + "\n" + cabecerasMs(h) + recursoCanonico(rutaUri, consulta);
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(clave, "HmacSHA256"));
            return Base64.getEncoder().encodeToString(mac.doFinal(cadena.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo firmar la solicitud a Azure", e);
        }
    }

    private static String cabecerasMs(Map<String, String> h) {
        TreeMap<String, String> ms = new TreeMap<>();
        h.forEach((k, v) -> {
            String n = k.toLowerCase(Locale.ROOT);
            if (n.startsWith("x-ms-")) ms.put(n, v.trim());
        });
        StringBuilder sb = new StringBuilder();
        ms.forEach((k, v) -> sb.append(k).append(':').append(v).append('\n'));
        return sb.toString();
    }

    private String recursoCanonico(String rutaUri, String consulta) {
        StringBuilder sb = new StringBuilder("/").append(cuenta).append(rutaUri);
        if (consulta != null && !consulta.isEmpty()) {
            TreeMap<String, String> q = new TreeMap<>();
            for (String par : consulta.split("&")) {
                String[] kv = par.split("=", 2);
                q.put(kv[0].toLowerCase(Locale.ROOT), kv.length > 1 ? kv[1] : "");
            }
            q.forEach((k, v) -> sb.append('\n').append(k).append(':').append(v));
        }
        return sb.toString();
    }

    private static String valor(Map<String, String> h, String nombre) {
        for (Map.Entry<String, String> e : h.entrySet()) {
            if (e.getKey().equalsIgnoreCase(nombre)) return e.getValue();
        }
        return "";
    }

    /** Codifica cada segmento de la ruta (espacios y tildes), conservando las "/". */
    static String codificarRuta(String nombre) {
        String[] partes = nombre.split("/", -1);
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < partes.length; i++) {
            if (i > 0) sb.append('/');
            sb.append(codificar(partes[i]));
        }
        return sb.toString();
    }

    private static String codificar(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8).replace("+", "%20");
    }

    private BlobException error(HttpResponse<byte[]> r, String mensaje) {
        String codigo = r.headers().firstValue("x-ms-error-code").orElse("sin código");
        return new BlobException(r.statusCode(), mensaje + " (HTTP " + r.statusCode() + ", " + codigo + ")");
    }

    private static Map<String, String> parsear(String cadena) {
        if (cadena == null || cadena.isBlank()) {
            throw new IllegalArgumentException("La cadena de conexión de Azure Storage está vacía");
        }
        Map<String, String> p = new HashMap<>();
        for (String parte : cadena.trim().split(";")) {
            int i = parte.indexOf('=');
            if (i > 0) p.put(parte.substring(0, i).trim(), parte.substring(i + 1).trim());
        }
        return p;
    }

    private static String requerido(Map<String, String> p, String clave) {
        String v = p.get(clave);
        if (v == null || v.isBlank()) {
            throw new IllegalArgumentException("Falta " + clave + " en la cadena de conexión de Azure Storage");
        }
        return v;
    }
}
