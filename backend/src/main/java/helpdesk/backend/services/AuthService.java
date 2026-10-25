package helpdesk.backend.services;

import helpdesk.backend.dtos.AuthResponse;
import helpdesk.backend.dtos.LoginRequest;
import helpdesk.backend.dtos.RegisterRequest;
import helpdesk.backend.dtos.Verify2faRequest;
import helpdesk.backend.entities.Rol;
import helpdesk.backend.entities.Usuario;
import helpdesk.backend.exceptions.ApiException;
import helpdesk.backend.repositories.RolRepository;
import helpdesk.backend.repositories.UsuarioRepository;
import helpdesk.backend.security.CustomUserDetailsService;
import helpdesk.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final Set<String> ROLES_VALIDOS = Set.of("admin", "soporte", "usuario");
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int MINUTOS_VALIDEZ_2FA = 5;
    private static final int MAX_INTENTOS_2FA = 5;

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService userDetailsService;
    private final EmailService emailService;
    private final CatalogoService catalogos;

    /**
     * Registro de usuarios: solo lo ejecuta un ADMIN (ver SecurityConfig).
     * El rol lo elige el administrador; ya no se deduce del dominio del correo.
     */
    public Map<String, Object> register(RegisterRequest request) {
        if (esVacio(request.getNombres()) || esVacio(request.getApellidos())
                || esVacio(request.getCorreo()) || esVacio(request.getPassword())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Nombres, apellidos, correo y contraseña son obligatorios");
        }
        if (request.getPassword().length() < 8) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "La contraseña debe tener al menos 8 caracteres");
        }
        String correo = request.getCorreo().trim().toLowerCase();
        if (usuarioRepository.existsByCorreoIgnoreCase(correo)) {
            throw new ApiException(HttpStatus.CONFLICT, "Ya existe un usuario con ese correo");
        }
        if (!esVacio(request.getDni()) && usuarioRepository.existsByDni(request.getDni())) {
            throw new ApiException(HttpStatus.CONFLICT, "Ya existe un usuario con ese DNI");
        }

        String nombreRol = esVacio(request.getRol()) ? "usuario" : request.getRol().trim().toLowerCase();
        if (!ROLES_VALIDOS.contains(nombreRol)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Rol inválido. Valores permitidos: admin, soporte, usuario");
        }
        Rol rol = rolRepository.findByNombreIgnoreCase(nombreRol)
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "El rol '" + nombreRol + "' no existe en la base de datos"));

        Usuario usuario = new Usuario();
        usuario.setNombres(normalizarEspacios(request.getNombres()));
        usuario.setApellidos(normalizarEspacios(request.getApellidos()));
        usuario.setCorreo(correo);
        usuario.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        usuario.setDni(esVacio(request.getDni()) ? null : request.getDni());
        usuario.setCargo(request.getCargo());
        usuario.setCelular(request.getCelular());
        usuario.setArea(catalogos.area(request.getArea()));
        usuario.setSede(catalogos.sede(request.getSede()));
        usuario.setSociedad(catalogos.sociedad(request.getSociedad()));
        usuario.setRol(rol);

        Usuario guardado = usuarioRepository.save(usuario);

        // No se devuelve un token: quien registra es el admin, no el nuevo usuario
        Map<String, Object> respuesta = new LinkedHashMap<>();
        respuesta.put("mensaje", "Usuario registrado correctamente");
        respuesta.put("id", guardado.getId());
        respuesta.put("nombre", guardado.getNombreCompleto());
        respuesta.put("correo", guardado.getCorreo());
        respuesta.put("rol", rol.getNombre());
        return respuesta;
    }

    public AuthResponse login(LoginRequest request) {
        // 1. Valida credenciales. Si son incorrectas lanza BadCredentialsException -> 401
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getCorreo(), request.getPassword())
        );

        Usuario usuario = usuarioRepository.findByCorreo(request.getCorreo())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Correo o contraseña incorrectos"));

        // 2. Codigo de 6 digitos con generador criptograficamente seguro (000000 - 999999)
        String codigoGenerado = String.format("%06d", RANDOM.nextInt(1_000_000));

        // 3. Se guarda con vencimiento y contador de intentos, y se envia por correo
        usuario.setCodigo2fa(codigoGenerado);
        usuario.setCodigo2faExpira(LocalDateTime.now().plusMinutes(MINUTOS_VALIDEZ_2FA));
        usuario.setCodigo2faIntentos((short) 0);
        usuarioRepository.save(usuario);
        emailService.enviarCorreo2FA(usuario.getCorreo(), codigoGenerado);

        // 4. Aun no se entrega el token real
        AuthResponse authResponse = new AuthResponse();
        authResponse.setToken("REQUIERE_2FA");
        return authResponse;
    }

    public AuthResponse verify2fa(Verify2faRequest request) {
        Usuario usuario = usuarioRepository.findByCorreo(request.getCorreo())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Código incorrecto o expirado"));

        if (usuario.getCodigo2fa() == null || usuario.getCodigo2faExpira() == null
                || LocalDateTime.now().isAfter(usuario.getCodigo2faExpira())) {
            limpiarCodigo2fa(usuario);
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Código incorrecto o expirado. Vuelve a iniciar sesión.");
        }

        if (request.getCodigo() == null || !mismoCodigo(usuario.getCodigo2fa(), request.getCodigo())) {
            short intentos = (short) (usuario.getCodigo2faIntentos() + 1);
            if (intentos >= MAX_INTENTOS_2FA) {
                // Demasiados intentos: se invalida el codigo para frenar ataques de fuerza bruta
                limpiarCodigo2fa(usuario);
                throw new ApiException(HttpStatus.UNAUTHORIZED,
                        "Demasiados intentos fallidos. Vuelve a iniciar sesión para recibir un nuevo código.");
            }
            usuario.setCodigo2faIntentos(intentos);
            usuarioRepository.save(usuario);
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Código incorrecto o expirado");
        }

        // El codigo es de un solo uso
        limpiarCodigo2fa(usuario);

        var userDetails = userDetailsService.loadUserByUsername(usuario.getCorreo());
        String jwtToken = jwtService.generateToken(userDetails);

        AuthResponse authResponse = new AuthResponse();
        authResponse.setToken(jwtToken);
        authResponse.setRole(usuario.getRol().getNombre());
        authResponse.setUsername(usuario.getNombreCompleto());
        return authResponse;
    }

    // Comparacion en tiempo constante para no filtrar informacion por tiempos de respuesta
    private static boolean mismoCodigo(String a, String b) {
        return MessageDigest.isEqual(a.getBytes(StandardCharsets.UTF_8), b.trim().getBytes(StandardCharsets.UTF_8));
    }

    private void limpiarCodigo2fa(Usuario usuario) {
        usuario.setCodigo2fa(null);
        usuario.setCodigo2faExpira(null);
        usuario.setCodigo2faIntentos((short) 0);
        usuarioRepository.save(usuario);
    }

    private static String normalizarEspacios(String s) {
        return s.trim().replaceAll("\\s+", " ");
    }

    private static boolean esVacio(String s) {
        return s == null || s.isBlank();
    }
}
