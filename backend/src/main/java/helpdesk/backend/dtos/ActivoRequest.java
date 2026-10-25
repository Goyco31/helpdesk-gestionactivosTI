package helpdesk.backend.dtos;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Datos para registrar un activo. La categoria llega por nombre (ej. "Laptop")
 * y se busca en el catalogo categoria_activo.
 */
@JsonIgnoreProperties(ignoreUnknown = true) // el Front puede enviar campos extra
public record ActivoRequest(
        String codigoPatrimonial,
        String categoria,
        String marca,
        String modelo,
        String numeroSerie,
        String sede,       // ej. "San Isidro"
        String sociedad    // ej. "Terpel Perú"
) {}
