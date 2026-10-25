package helpdesk.backend.controllers;

import helpdesk.backend.entities.CategoriaActivo;
import helpdesk.backend.entities.EstadoActivo;
import helpdesk.backend.repositories.CategoriaActivoRepository;
import helpdesk.backend.repositories.EstadoActivoRepository;
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

    @GetMapping("/estados")
    public ResponseEntity<List<EstadoActivo>> estados() {
        return ResponseEntity.ok(estadoRepository.findAll(Sort.by("id")));
    }

    @GetMapping("/categorias")
    public ResponseEntity<List<CategoriaActivo>> categorias() {
        return ResponseEntity.ok(categoriaRepository.findAll(Sort.by("nombre")));
    }
}
