-- =====================================================================
-- Migracion V3 - Separar AREA (departamento) de SEDE (lugar fisico)
-- y activar el catalogo de SOCIEDAD.
--
-- Requiere haber ejecutado antes la V2. Ejecutar UNA sola vez en DBeaver
-- con Alt+X ("Ejecutar script"). Corre en una transaccion.
--
--   area     -> departamento del colaborador (Sistemas, Legal, ...)
--   sede     -> lugar fisico (San Isidro, Planta Callao); aplica al
--               colaborador y al activo
--   sociedad -> razon social (Terpel Peru, Terpel Comercial Peru)
-- =====================================================================
BEGIN;

-- ---------------------------------------------------------------------
-- 1. Catalogos
-- ---------------------------------------------------------------------
ALTER TABLE area     ADD CONSTRAINT uq_area_nombre     UNIQUE (nombre);
ALTER TABLE sociedad ADD CONSTRAINT uq_sociedad_nombre UNIQUE (nombre);

INSERT INTO area (nombre) VALUES
    ('Cartera'), ('Contabilidad'), ('Facturación'), ('Gestión Humana'),
    ('Legal'), ('Marketing'), ('Planeamiento'), ('Sistemas')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO sociedad (nombre) VALUES
    ('Terpel Perú'), ('Terpel Comercial Perú')
ON CONFLICT (nombre) DO NOTHING;

CREATE TABLE sede (
    id     SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL CONSTRAINT uq_sede_nombre UNIQUE
);

INSERT INTO sede (nombre) VALUES ('San Isidro'), ('Planta Callao');

-- ---------------------------------------------------------------------
-- 2. Usuario
--    El campo de texto "area" en realidad guardaba la SEDE (el formulario
--    mostraba "Oficina San Isidro" pero guardaba "Lima Central"). Se
--    recupera como sede y la columna de texto se elimina.
--    El area (departamento) de los usuarios existentes queda vacia:
--    completala con UPDATE (ver ejemplo al final).
-- ---------------------------------------------------------------------
ALTER TABLE usuario ADD COLUMN sede_id INTEGER CONSTRAINT fk_user_sede REFERENCES sede(id);

UPDATE usuario u SET sede_id = s.id
FROM sede s
WHERE s.nombre = CASE
        WHEN lower(u.area) LIKE '%callao%'                                   THEN 'Planta Callao'
        WHEN lower(u.area) LIKE '%isidro%' OR lower(u.area) LIKE '%lima%'   THEN 'San Isidro'
      END;

-- Por si alguien escribio un departamento en el campo de texto
UPDATE usuario u SET area_id = a.id
FROM area a
WHERE lower(a.nombre) = lower(trim(u.area));

ALTER TABLE usuario DROP COLUMN area;

-- ---------------------------------------------------------------------
-- 3. Activo: sede donde se encuentra (la sociedad ya tenia su columna)
-- ---------------------------------------------------------------------
ALTER TABLE activo ADD COLUMN sede_id INTEGER CONSTRAINT fk_activo_sede REFERENCES sede(id);

CREATE INDEX idx_usuario_area  ON usuario(area_id);
CREATE INDEX idx_activo_sede   ON activo(sede_id);

COMMIT;

-- =====================================================================
-- Despues de ejecutar: completa area, sede y sociedad de cada usuario.
--   SELECT u.id, u.nombres, u.apellidos, a.nombre area, s.nombre sede, so.nombre sociedad
--     FROM usuario u LEFT JOIN area a ON a.id = u.area_id
--     LEFT JOIN sede s ON s.id = u.sede_id LEFT JOIN sociedad so ON so.id = u.sociedad_id
--     ORDER BY u.id;
--
--   UPDATE usuario SET
--       area_id     = (SELECT id FROM area     WHERE nombre = 'Sistemas'),
--       sede_id     = (SELECT id FROM sede     WHERE nombre = 'San Isidro'),
--       sociedad_id = (SELECT id FROM sociedad WHERE nombre = 'Terpel Perú')
--   WHERE id = 4;
-- =====================================================================
