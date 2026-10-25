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
        // Validación estricta: Debe iniciar con "TERPEL " seguido de 1 a 8 números
        if (activo.getCodigoPatrimonial() == null || !activo.getCodigoPatrimonial().matches("^TERPEL \\d{1,8}$")) {
            throw new RuntimeException("Error de validación: El formato debe ser 'TERPEL ' seguido de hasta 8 números.");
        }

        if (activo.getEstado() == null || activo.getEstado().isEmpty()) {
            activo.setEstado("Disponible");
        }
        
        return activoRepository.save(activo);
    }
}