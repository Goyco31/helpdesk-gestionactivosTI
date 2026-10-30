-- =====================================================================
-- Migracion V9 - Prioridades de ticket alineadas al SLA del informe.
-- El SLA (seccion 3.3.2) define solo Alta, Media y Baja; se retira "Crítica".
-- Ejecutar con Alt+X en DBeaver (requiere V2-V8).
-- =====================================================================
BEGIN;

-- Si existiera algun ticket con prioridad Crítica, pasa a Alta (la mas exigente del SLA)
UPDATE ticket SET prioridad = 'Alta' WHERE prioridad = 'Crítica';

ALTER TABLE ticket DROP CONSTRAINT ck_ticket_prioridad;
ALTER TABLE ticket ADD CONSTRAINT ck_ticket_prioridad
    CHECK (prioridad IN ('Baja', 'Media', 'Alta'));

COMMIT;
