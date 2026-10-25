-- =====================================================================
-- Migracion V6 - Descripcion del ticket (lo que el colaborador escribe
-- al crear su solicitud en el portal). Ejecutar con Alt+X en DBeaver.
-- =====================================================================
BEGIN;
ALTER TABLE ticket ADD COLUMN descripcion VARCHAR(500);
COMMIT;
