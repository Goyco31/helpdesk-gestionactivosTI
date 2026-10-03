package helpdesk.backend.services;

import helpdesk.backend.entities.Activo;
import helpdesk.backend.repositories.ActivoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ActivoService {

    private final ActivoRepository activoRepository;

    public List<Activo> listarTodos() {
        return activoRepository.findAll();
    }

    public Activo crearActivo(Activo activo) {
        // Por defecto, cuando registramos un equipo nuevo, su estado es "Disponible"
        if (activo.getEstado() == null || activo.getEstado().isEmpty()) {
            activo.setEstado("Disponible");
        }
        return activoRepository.save(activo);
    }
}