-- =====================================================================
-- Migracion V2 - Catalogos con FK, nombres/apellidos, historial de
-- movimientos inalterable y campos para SLA / 2FA.
--
-- Ejecutar UNA sola vez en DBeaver sobre la BD de Azure (Alt+X =
-- "Ejecutar script"). Todo corre en una transaccion: si algo falla,
-- no se aplica nada.
--
-- Responde a las observaciones 6, 7, 10 y 11 del APF2.
-- =====================================================================
BEGIN;

-- ---------------------------------------------------------------------
-- 0. Eliminar el trigger antiguo: hacia referencia a columnas que no
--    existian (acta.estado, acta.tipo, activo.usuario_actual_id) y
--    habria fallado en el primer UPDATE sobre acta. La regla de negocio
--    ahora vive en el Back-End (MovimientoService).
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_actualizar_usuario_actual ON acta;
DROP FUNCTION IF EXISTS fn_actualizar_usuario_actual();

-- ---------------------------------------------------------------------
-- 1. Catalogos: nombres unicos y valores iniciales
-- ---------------------------------------------------------------------
ALTER TABLE estado_activo    ADD CONSTRAINT uq_estado_activo_nombre    UNIQUE (nombre);
ALTER TABLE categoria_activo ADD CONSTRAINT uq_categoria_activo_nombre UNIQUE (nombre);

INSERT INTO estado_activo (nombre) VALUES
    ('por asignar'),       -- disponible en almacen
    ('en uso'),            -- asignado a un colaborador
    ('en préstamo'),       -- asignado temporalmente
    ('en mantenimiento'),
    ('para donar'),
    ('para baja'),
    ('de baja')            -- estado final; se oculta del inventario
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO categoria_activo (nombre) VALUES
    ('Laptop'), ('CPU'), ('Monitor'), ('Impresora'), ('TV'),
    ('ClickShare'), ('Router'), ('Switch'), ('Servidor')
ON CONFLICT (nombre) DO NOTHING;

-- Por si existiera alguna categoria escrita a mano que no este en la lista
INSERT INTO categoria_activo (nombre)
SELECT DISTINCT trim(categoria) FROM activo
WHERE trim(categoria) <> ''
ON CONFLICT (nombre) DO NOTHING;

-- ---------------------------------------------------------------------
-- 2. Activo: pasar de texto a FK (una sola fuente de verdad)
-- ---------------------------------------------------------------------
UPDATE activo a SET categoria_id = c.id
FROM categoria_activo c
WHERE c.nombre = trim(a.categoria);

UPDATE activo a SET estado_id = e.id
FROM estado_activo e
WHERE e.nombre = CASE lower(trim(a.estado))
                    WHEN 'disponible'       THEN 'por asignar'
                    WHEN 'asignado'         THEN 'en uso'
                    WHEN 'en uso'           THEN 'en uso'
                    WHEN 'mantenimiento'    THEN 'en mantenimiento'
                    WHEN 'en mantenimiento' THEN 'en mantenimiento'
                    WHEN 'baja'             THEN 'de baja'
                    ELSE 'por asignar'
                 END;

ALTER TABLE activo ALTER COLUMN categoria_id SET NOT NULL;
ALTER TABLE activo ALTER COLUMN estado_id    SET NOT NULL;
ALTER TABLE activo DROP COLUMN categoria;
ALTER TABLE activo DROP COLUMN estado;

-- Colaborador que tiene el equipo ahora (NULL = en almacen).
-- Al ser una sola columna, un activo nunca puede estar asignado a dos personas.
ALTER TABLE activo ADD COLUMN usuario_actual_id INTEGER
    CONSTRAINT fk_activo_usuario_actual REFERENCES usuario(id);
ALTER TABLE activo ADD COLUMN fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX idx_activo_estado          ON activo(estado_id);
CREATE INDEX idx_activo_usuario_actual  ON activo(usuario_actual_id);

-- ---------------------------------------------------------------------
-- 3. Usuario: separar nombres y apellidos (para nombrar los PDF)
--    Regla para los datos existentes: la primera mitad de las palabras
--    son nombres y el resto apellidos. REVISAR las filas al final.
-- ---------------------------------------------------------------------
ALTER TABLE usuario ADD COLUMN nombres   VARCHAR(100);
ALTER TABLE usuario ADD COLUMN apellidos VARCHAR(100);

UPDATE usuario u SET
    nombres = array_to_string(p.w[1:greatest(1, cardinality(p.w) / 2)], ' '),
    apellidos = coalesce(array_to_string(p.w[greatest(1, cardinality(p.w) / 2) + 1:], ' '), '')
FROM (SELECT id, regexp_split_to_array(trim(nombre), '\s+') AS w FROM usuario) p
WHERE p.id = u.id;

ALTER TABLE usuario ALTER COLUMN nombres   SET NOT NULL;
ALTER TABLE usuario ALTER COLUMN apellidos SET NOT NULL;
ALTER TABLE usuario DROP COLUMN nombre;

-- 2FA: el codigo vence y tiene intentos limitados
ALTER TABLE usuario ADD COLUMN codigo_2fa_expira  TIMESTAMP;
ALTER TABLE usuario ADD COLUMN codigo_2fa_intentos SMALLINT NOT NULL DEFAULT 0;

-- ---------------------------------------------------------------------
-- 4. Ticket: estados y prioridades validos, tecnico y fecha de cierre
--    (fecha_finalizacion la usan los KPI de SLA y MTTR del informe)
-- ---------------------------------------------------------------------
ALTER TABLE ticket ADD COLUMN tecnico_id INTEGER CONSTRAINT fk_ticket_tecnico REFERENCES usuario(id);
ALTER TABLE ticket ADD COLUMN fecha_finalizacion TIMESTAMP;
ALTER TABLE ticket ALTER COLUMN fecha_creacion SET NOT NULL;

ALTER TABLE ticket ADD CONSTRAINT ck_ticket_estado
    CHECK (estado IN ('Abierto', 'En Proceso', 'Resuelto', 'Cerrado'));
ALTER TABLE ticket ADD CONSTRAINT ck_ticket_prioridad
    CHECK (prioridad IN ('Baja', 'Media', 'Alta', 'Crítica'));
ALTER TABLE ticket ADD CONSTRAINT ck_ticket_finalizacion
    CHECK ((estado IN ('Resuelto', 'Cerrado')) = (fecha_finalizacion IS NOT NULL));

CREATE INDEX idx_ticket_usuario ON ticket(usuario_id);

-- ---------------------------------------------------------------------
-- 5. Acta: estado de firma (la generacion del PDF llega en la Parte 3)
-- ---------------------------------------------------------------------
ALTER TABLE acta ADD COLUMN estado VARCHAR(20) NOT NULL DEFAULT 'pendiente_firma';
ALTER TABLE acta ADD CONSTRAINT ck_acta_estado
    CHECK (estado IN ('pendiente_firma', 'firmada', 'anulada'));
ALTER TABLE acta ADD CONSTRAINT ck_acta_tipo
    CHECK (tipo_acta IN ('Entrega', 'Devolucion', 'Prestamo'));
ALTER TABLE acta ALTER COLUMN fecha_generacion SET NOT NULL;
ALTER TABLE acta ADD CONSTRAINT uq_acta_url_pdf UNIQUE (url_pdf);

-- ---------------------------------------------------------------------
-- 6. Historial de movimientos (tabla independiente e inalterable)
--
--    Cada fila es un movimiento identificado por su propio id (clave
--    sustituta). Ya no se usa "numero de serie + fecha + correo": esa
--    combinacion podia repetirse (dos movimientos del mismo equipo el
--    mismo dia) y el correo de un usuario puede cambiar. Las FK a
--    activo, ticket y usuario conservan la trazabilidad completa.
-- ---------------------------------------------------------------------
CREATE TABLE movimiento (
    id                 SERIAL PRIMARY KEY,
    activo_id          INTEGER     NOT NULL REFERENCES activo(id),
    ticket_id          INTEGER     NOT NULL REFERENCES ticket(id),   -- ningun movimiento sin ticket
    tipo               VARCHAR(20) NOT NULL,
    usuario_origen_id  INTEGER     REFERENCES usuario(id),           -- quien tenia el equipo
    usuario_destino_id INTEGER     REFERENCES usuario(id),           -- quien lo recibe
    estado_anterior_id INTEGER     NOT NULL REFERENCES estado_activo(id),
    estado_nuevo_id    INTEGER     NOT NULL REFERENCES estado_activo(id),
    registrado_por_id  INTEGER     NOT NULL REFERENCES usuario(id),  -- tecnico de soporte / admin
    fecha              TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_devolucion_prevista DATE,                                  -- solo prestamos
    observacion        VARCHAR(500),
    acta_id            INTEGER     REFERENCES acta(id),              -- se completa al generar el PDF

    CONSTRAINT ck_mov_tipo CHECK (tipo IN
        ('asignacion', 'prestamo', 'devolucion', 'reasignacion', 'cambio_estado')),

    -- Coherencia de usuarios segun el tipo de movimiento
    CONSTRAINT ck_mov_usuarios CHECK (
        (tipo IN ('asignacion', 'prestamo') AND usuario_origen_id IS NULL     AND usuario_destino_id IS NOT NULL) OR
        (tipo = 'devolucion'                AND usuario_origen_id IS NOT NULL AND usuario_destino_id IS NULL)     OR
        (tipo = 'reasignacion'              AND usuario_origen_id IS NOT NULL AND usuario_destino_id IS NOT NULL
                                            AND usuario_origen_id <> usuario_destino_id)                          OR
        (tipo = 'cambio_estado'             AND usuario_origen_id IS NULL     AND usuario_destino_id IS NULL)
    ),
    CONSTRAINT ck_mov_prestamo CHECK ((tipo = 'prestamo') = (fecha_devolucion_prevista IS NOT NULL))
);

CREATE INDEX idx_movimiento_activo  ON movimiento(activo_id, fecha);
CREATE INDEX idx_movimiento_ticket  ON movimiento(ticket_id);
CREATE INDEX idx_movimiento_destino ON movimiento(usuario_destino_id);

-- Inalterable: no se permite DELETE ni UPDATE. Unica excepcion: enlazar
-- el acta una sola vez (acta_id de NULL a un valor) al generar el PDF.
CREATE OR REPLACE FUNCTION fn_movimiento_inalterable()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'TRUNCATE' THEN
        RAISE EXCEPTION 'El historial de movimientos es inalterable: no se permite vaciar la tabla';
    END IF;

    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'El historial de movimientos es inalterable: no se permite eliminar (movimiento %)', OLD.id;
    END IF;

    IF OLD.acta_id IS NULL AND NEW.acta_id IS NOT NULL
       AND (NEW.id, NEW.activo_id, NEW.ticket_id, NEW.tipo, NEW.usuario_origen_id, NEW.usuario_destino_id,
            NEW.estado_anterior_id, NEW.estado_nuevo_id, NEW.registrado_por_id, NEW.fecha,
            NEW.fecha_devolucion_prevista, NEW.observacion)
           IS NOT DISTINCT FROM
           (OLD.id, OLD.activo_id, OLD.ticket_id, OLD.tipo, OLD.usuario_origen_id, OLD.usuario_destino_id,
            OLD.estado_anterior_id, OLD.estado_nuevo_id, OLD.registrado_por_id, OLD.fecha,
            OLD.fecha_devolucion_prevista, OLD.observacion)
    THEN
        RETURN NEW;
    END IF;

    RAISE EXCEPTION 'El historial de movimientos es inalterable: no se permite modificar (movimiento %)', OLD.id;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_movimiento_inalterable
    BEFORE UPDATE OR DELETE ON movimiento
    FOR EACH ROW EXECUTE FUNCTION fn_movimiento_inalterable();

-- TRUNCATE tambien queda bloqueado
CREATE TRIGGER trg_movimiento_sin_truncate
    BEFORE TRUNCATE ON movimiento
    FOR EACH STATEMENT EXECUTE FUNCTION fn_movimiento_inalterable();

COMMIT;

-- =====================================================================
-- Verificacion (ejecutar despues): revisa que nombres/apellidos hayan
-- quedado bien separados y corrige a mano los que no.
--   SELECT id, nombres, apellidos, correo FROM usuario ORDER BY id;
--   SELECT a.codigo_patrimonial, c.nombre AS categoria, e.nombre AS estado
--     FROM activo a JOIN categoria_activo c ON c.id = a.categoria_id
--                   JOIN estado_activo e    ON e.id = a.estado_id;
-- =====================================================================
