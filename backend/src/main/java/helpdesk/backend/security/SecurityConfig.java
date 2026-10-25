package helpdesk.backend.security;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

/**
 * Configuracion central de seguridad.
 *
 * Matriz de acceso por rol (los roles de la BD son admin, soporte y usuario;
 * Spring los maneja como ROLE_ADMIN, ROLE_SOPORTE y ROLE_USUARIO):
 *
 *  Endpoint                         | Publico | USUARIO | SOPORTE | ADMIN
 *  ---------------------------------+---------+---------+---------+------
 *  POST /api/auth/login, verify-2fa |   si    |   si    |   si    |  si
 *  POST /api/auth/register          |   no    |   no    |   no    |  si
 *  GET  /api/activos/**             |   no    |   no    |   si    |  si
 *  POST/PUT/DELETE /api/activos/**  |   no    |   no    |   si    |  si
 *  POST /api/tickets                |   no    |   si    |   si    |  si
 *  GET  /api/tickets                |   no    | solo los suyos | todos | todos
 *
 * Sin token -> 401. Token valido pero rol sin permiso -> 403.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final CustomUserDetailsService userDetailsService;

    // Lista de dominios autorizados, tomada de CORS_ALLOWED_ORIGINS (nunca "*")
    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable()) // API stateless con JWT en cabecera: no usa cookies de sesion
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll() // preflight de CORS
                .requestMatchers("/api/auth/login", "/api/auth/verify-2fa").permitAll()
                .requestMatchers("/error").permitAll()
                // Solo el administrador crea cuentas
                .requestMatchers("/api/auth/register").hasRole("ADMIN")
                // Inventario: solo personal de TI
                .requestMatchers("/api/activos/**").hasAnyRole("ADMIN", "SOPORTE")
                // Tickets: cualquier usuario autenticado (el servicio filtra lo que ve cada rol)
                .requestMatchers("/api/tickets/**").hasAnyRole("ADMIN", "SOPORTE", "USUARIO")
                .anyRequest().authenticated()
            )
            .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex
                // 401: no hay token, o es invalido/expirado
                .authenticationEntryPoint((request, response, e) -> {
                    Object jwtError = request.getAttribute("jwt_error");
                    String detalle = jwtError != null ? jwtError.toString() : "Se requiere autenticación";
                    escribirError(response, HttpServletResponse.SC_UNAUTHORIZED, "No autenticado", detalle, request.getRequestURI());
                })
                // 403: token valido pero el rol no tiene permiso
                .accessDeniedHandler((request, response, e) ->
                    escribirError(response, HttpServletResponse.SC_FORBIDDEN, "Acceso denegado",
                            "Tu rol no tiene permiso para esta operación", request.getRequestURI()))
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    private static void escribirError(HttpServletResponse response, int status, String error,
                                      String mensaje, String ruta) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write(String.format(
                "{\"status\":%d,\"error\":\"%s\",\"mensaje\":\"%s\",\"ruta\":\"%s\"}",
                status, error, mensaje, ruta.replace("\"", "")));
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        List<String> origenes = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(o -> !o.isEmpty() && !o.equals("*")) // se descarta el comodin a proposito
                .toList();

        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(origenes);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
