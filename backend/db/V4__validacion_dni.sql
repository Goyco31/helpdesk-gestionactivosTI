-- =====================================================================
-- Migracion V4 - El DNI debe tener exactamente 8 digitos numericos.
-- Ejecutar con Alt+X en DBeaver. Requiere V2 y V3.
--
-- PASO PREVIO: revisa si algun DNI actual no cumple el formato.
-- Si esta consulta devuelve filas, corrigelas (UPDATE) o dejalas en NULL
-- antes de ejecutar el resto; si no, el ALTER fallara y no se aplicara nada.
--
--   SELECT id, nombres, apellidos, dni FROM usuario
--   WHERE dni IS NOT NULL AND dni !~ '^[0-9]{8}$';
-- =====================================================================
BEGIN;

-- Quitar espacios que pudieran haberse colado
UPDATE usuario SET dni = trim(dni) WHERE dni IS NOT NULL AND dni <> trim(dni);

ALTER TABLE usuario ALTER COLUMN dni TYPE VARCHAR(8);
ALTER TABLE usuario ADD CONSTRAINT ck_usuario_dni CHECK (dni ~ '^[0-9]{8}$');

COMMIT;
