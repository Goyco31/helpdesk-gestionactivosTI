package helpdesk.backend.controllers;

import helpdesk.backend.entities.Area;
import helpdesk.backend.entities.CategoriaActivo;
import helpdesk.backend.entities.EstadoActivo;
import helpdesk.backend.entities.Sede;
import helpdesk.backend.entities.Sociedad;
import helpdesk.backend.repositories.AreaRepository;
import helpdesk.backend.repositories.CategoriaActivoRepository;
import helpdesk.backend.repositories.EstadoActivoRepository;
import helpdesk.backend.repositories.SedeRepository;
import helpdesk.backend.repositories.SociedadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Catalogos para llenar listas desplegables en el Front. */
@RestController
@RequestMapping("/api/catalogos")
@RequiredArgsConstructor
public class CatalogoController {

    private final EstadoActivoRepository estadoRepository;
    private final CategoriaActivoRepository categoriaRepository;
    private final AreaRepository areaRepository;
    private final SedeRepository sedeRepository;
    private final SociedadRepository sociedadRepository;

    @GetMapping("/estados")
    public ResponseEntity<List<EstadoActivo>> estados() {
        return ResponseEntity.ok(estadoRepository.findAll(Sort.by("id")));
    }

    @GetMapping("/categorias")
    public ResponseEntity<List<CategoriaActivo>> categorias() {
        return ResponseEntity.ok(categoriaRepository.findAll(Sort.by("nombre")));
    }

    @GetMapping("/areas")
    public ResponseEntity<List<Area>> areas() {
        return ResponseEntity.ok(areaRepository.findAll(Sort.by("nombre")));
    }

    @GetMapping("/sedes")
    public ResponseEntity<List<Sede>> sedes() {
        return ResponseEntity.ok(sedeRepository.findAll(Sort.by("id")));
    }

    @GetMapping("/sociedades")
    public ResponseEntity<List<Sociedad>> sociedades() {
        return ResponseEntity.ok(sociedadRepository.findAll(Sort.by("id")));
    }
}
