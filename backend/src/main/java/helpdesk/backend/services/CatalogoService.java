package helpdesk.backend.services;

import helpdesk.backend.entities.Area;
import helpdesk.backend.entities.Sede;
import helpdesk.backend.entities.Sociedad;
import helpdesk.backend.exceptions.ApiException;
import helpdesk.backend.repositories.AreaRepository;
import helpdesk.backend.repositories.SedeRepository;
import helpdesk.backend.repositories.SociedadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.function.Function;

/**
 * Busca valores de los catalogos por nombre. Si el nombre no existe responde 400,
 * asi nunca se guarda un texto libre distinto a los valores oficiales.
 */
@Service
@RequiredArgsConstructor
public class CatalogoService {

    private final AreaRepository areaRepository;
    private final SedeRepository sedeRepository;
    private final SociedadRepository sociedadRepository;

    public Area area(String nombre) {
        return buscar(nombre, "área", areaRepository::findByNombreIgnoreCase);
    }

    public Sede sede(String nombre) {
        return buscar(nombre, "sede", sedeRepository::findByNombreIgnoreCase);
    }

    public Sociedad sociedad(String nombre) {
        return buscar(nombre, "sociedad", sociedadRepository::findByNombreIgnoreCase);
    }

    private static <T> T buscar(String nombre, String campo, Function<String, Optional<T>> finder) {
        if (nombre == null || nombre.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "El campo " + campo + " es obligatorio");
        }
        return finder.apply(nombre.trim())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST,
                        "Valor de " + campo + " no válido: " + nombre));
    }
}
