package helpdesk.backend.services;

import helpdesk.backend.dtos.AuthResponse;
import helpdesk.backend.dtos.LoginRequest;
import helpdesk.backend.dtos.RegisterRequest;
import helpdesk.backend.dtos.Verify2faRequest;
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

import java.util.Random;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService userDetailsService;
    private final EmailService emailService; // Inyectamos el servicio de correos

    public AuthResponse register(RegisterRequest request) {
        String nombreRol = request.getCorreo().endsWith("@utp.edu.pe") ? "Admin" : "Usuario";
        Rol rol = rolRepository.findByNombre(nombreRol)
                .orElseThrow(() -> new RuntimeException("Error: Rol no encontrado."));

        Usuario usuario = new Usuario();
        usuario.setNombre(request.getNombre());
        usuario.setCorreo(request.getCorreo());
        usuario.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        usuario.setDni(request.getDni());
        usuario.setCargo(request.getCargo());
        usuario.setCelular(request.getCelular());
        usuario.setArea(request.getArea());
        usuario.setRol(rol);

        usuarioRepository.save(usuario);

        var userDetails = userDetailsService.loadUserByUsername(usuario.getCorreo());
        String jwtToken = jwtService.generateToken(userDetails);
        
        AuthResponse authResponse = new AuthResponse();
        authResponse.setToken(jwtToken);
        return authResponse;
    }

    public AuthResponse login(LoginRequest request) {
        // 1. Validamos credenciales (si la contraseña está mal, lanza error automáticamente)
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getCorreo(), request.getPassword())
        );

        Usuario usuario = usuarioRepository.findByCorreo(request.getCorreo())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // 2. Generamos un código de 6 dígitos aleatorio
        String codigoGenerado = String.format("%06d", new Random().nextInt(999999));
        
        // 3. Lo guardamos en la base de datos
        usuario.setCodigo2fa(codigoGenerado);
        usuarioRepository.save(usuario);

        // 4. Lo enviamos por correo
        emailService.enviarCorreo2FA(usuario.getCorreo(), codigoGenerado);

        // 5. Retornamos un mensaje de aviso en lugar del token real
        AuthResponse authResponse = new AuthResponse();
        authResponse.setToken("REQUIERE_2FA"); 
        return authResponse;
    }

    public AuthResponse verify2fa(Verify2faRequest request) {
        Usuario usuario = usuarioRepository.findByCorreo(request.getCorreo())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Verificamos que el código coincida
        if (usuario.getCodigo2fa() != null && usuario.getCodigo2fa().equals(request.getCodigo())) {
            
            // Limpiamos el código para que no se pueda reusar
            usuario.setCodigo2fa(null);
            usuarioRepository.save(usuario);

            // Generamos el token final
            var userDetails = userDetailsService.loadUserByUsername(usuario.getCorreo());
            String jwtToken = jwtService.generateToken(userDetails);

            AuthResponse authResponse = new AuthResponse();
            authResponse.setToken(jwtToken);
            authResponse.setRole(usuario.getRol().getNombre()); 
            authResponse.setUsername(usuario.getNombre());
            return authResponse;
        } else {
            throw new RuntimeException("Código incorrecto o expirado");
        }
    }
}