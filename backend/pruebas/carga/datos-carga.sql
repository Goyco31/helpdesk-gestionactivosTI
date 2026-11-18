-- =====================================================================
-- Datos para la prueba de carga de operaciones (operaciones.k6.js).
-- EJECUTAR SOLO EN LA BASE DE PRUEBA "helpdesk_carga", nunca en la real:
-- los movimientos de prueba quedan en el historial inalterable.
-- =====================================================================
BEGIN;

-- Colaborador de prueba (no puede iniciar sesion: su hash no corresponde a ninguna contrasena)
INSERT INTO usuario (nombres, apellidos, correo, password_hash, rol_id, codigo_2fa_intentos)
VALUES ('Colaborador', 'Prueba de carga', 'k6.colaborador@prueba.local', 'sin-acceso',
        (SELECT id FROM rol WHERE lower(nombre) = 'usuario'), 0)
ON CONFLICT (correo) DO NOTHING;

-- 10 laptops de prueba disponibles
INSERT INTO activo (codigo_patrimonial, categoria_id, marca, modelo, numero_serie, estado_id, fecha_registro)
SELECT 'K6-' || lpad(g::text, 3, '0'),
       (SELECT id FROM categoria_activo WHERE nombre = 'Laptop'),
       'Prueba', 'Carga k6', 'K6-SERIE-' || g,
       (SELECT id FROM estado_activo WHERE nombre = 'por asignar'),
       now()
FROM generate_series(1, 10) AS g
ON CONFLICT (codigo_patrimonial) DO NOTHING;

-- 10 tickets abiertos del colaborador de prueba (uno por usuario virtual)
INSERT INTO ticket (usuario_id, asunto, categoria, prioridad, estado, fecha_creacion)
SELECT u.id, 'K6 carga ' || lpad(g::text, 3, '0'), 'Equipos', 'Media', 'Abierto', now()
FROM usuario u, generate_series(1, 10) AS g
WHERE u.correo = 'k6.colaborador@prueba.local';

COMMIT;

-- Comprobacion: debe mostrar 10 y 10
SELECT (SELECT count(*) FROM activo WHERE codigo_patrimonial LIKE 'K6-%') AS activos_k6,
       (SELECT count(*) FROM ticket WHERE asunto LIKE 'K6 carga%') AS tickets_k6;
