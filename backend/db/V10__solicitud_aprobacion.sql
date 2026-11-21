-- =====================================================================
-- Migracion V10 - Codigo de catalogo y aprobacion de solicitudes de acceso.
-- Cada ticket puede indicar su codigo del catalogo de solicitudes (SOL-01 a
-- SOL-06, seccion 8.1). Las de acceso privilegiado (SOL-04 y SOL-05) no pueden
-- pasar a En Proceso, Resuelto ni Cerrado sin la aprobacion registrada de la
-- Jefatura de TI (quien, cuando y con que evidencia).
-- Ejecutar con Alt+X en DBeaver (requiere V2-V9).
-- =====================================================================
BEGIN;

ALTER TABLE ticket
    ADD COLUMN codigo_solicitud     VARCHAR(6),
    ADD COLUMN aprobado_por_id      INTEGER REFERENCES usuario (id),
    ADD COLUMN fecha_aprobacion     TIMESTAMP,
    ADD COLUMN evidencia_aprobacion VARCHAR(300);

ALTER TABLE ticket ADD CONSTRAINT ck_ticket_codigo_solicitud
    CHECK (codigo_solicitud IS NULL OR codigo_solicitud IN
           ('SOL-01', 'SOL-02', 'SOL-03', 'SOL-04', 'SOL-05', 'SOL-06'));

-- La aprobacion se registra completa o no se registra
ALTER TABLE ticket ADD CONSTRAINT ck_ticket_aprobacion_completa
    CHECK ((aprobado_por_id IS NULL AND fecha_aprobacion IS NULL AND evidencia_aprobacion IS NULL)
        OR (aprobado_por_id IS NOT NULL AND fecha_aprobacion IS NOT NULL AND evidencia_aprobacion IS NOT NULL));

COMMIT;
