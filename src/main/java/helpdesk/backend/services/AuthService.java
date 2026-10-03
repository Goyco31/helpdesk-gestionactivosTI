package helpdesk.backend.services;

import helpdesk.backend.dtos.AuthResponse;
import helpdesk.backend.dtos.LoginRequest;
import helpdesk.backend.dtos.RegisterRequest;
import helpdesk.backend.entities.Rol;
import helpdesk.backend.entities.Usuario;
import helpdesk.backend.repositories.RolRepository;
import helpdesk.backend.repositories.UsuarioRepository;
import helpdesk.backend.security.CustomUserDetailsService;
import helpdesk.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService userDetailsService;

    public AuthResponse register(RegisterRequest request) {
        // Regla de negocio: Si es correo UTP, es Admin. Si no, es Usuario normal.
        String nombreRol = request.getCorreo().endsWith("@utp.edu.pe") ? "Admin" : "Usuario";

        Rol rol = rolRepository.findByNombre(nombreRol)
                .orElseThrow(() -> new RuntimeException("Error: Rol no encontrado en la base de datos."));

        // Creamos el usuario y encriptamos su contraseña
        Usuario usuario = new Usuario();
        usuario.setNombre(request.getNombre());
        usuario.setCorreo(request.getCorreo());
        usuario.setPasswordHash(passwordEncoder.encode(request.getPassword())); 
        usuario.setRol(rol);

        usuarioRepository.save(usuario);

        // Generamos el token JWT para que inicie sesión automáticamente al registrarse
        var userDetails = userDetailsService.loadUserByUsername(usuario.getCorreo());
        String jwtToken = jwtService.generateToken(userDetails);

        AuthResponse authResponse = new AuthResponse();
        authResponse.setToken(jwtToken);
        return authResponse;
    }

    public AuthResponse login(LoginRequest request) {
        // Spring Security valida automáticamente que el correo y la contraseña (desencriptada) coincidan
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getCorreo(), request.getPassword())
        );

        // Si la autenticación es exitosa, generamos el token
        var userDetails = userDetailsService.loadUserByUsername(request.getCorreo());
        String jwtToken = jwtService.generateToken(userDetails);

        AuthResponse authResponse = new AuthResponse();
        authResponse.setToken(jwtToken);
        return authResponse;
    }
}