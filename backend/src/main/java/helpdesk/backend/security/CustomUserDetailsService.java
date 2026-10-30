package helpdesk.backend.security;

import helpdesk.backend.entities.Usuario;
import helpdesk.backend.repositories.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    @Override
    public UserDetails loadUserByUsername(String correo) throws UsernameNotFoundException {
        // 1. Buscamos al usuario por su correo en la BD
        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado con el correo: " + correo));

        // 2. Extraemos su rol y le agregamos el prefijo "ROLE_" (Regla estricta de Spring Security)
        SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + usuario.getRol().getNombre().toUpperCase());

        // 3. Retornamos el usuario en el formato oficial de Spring Security
        return new User(
                usuario.getCorreo(),
                usuario.getPasswordHash(),
                Collections.singletonList(authority)
        );
    }
}