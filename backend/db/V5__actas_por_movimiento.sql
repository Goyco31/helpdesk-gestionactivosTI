-- =====================================================================
-- Migracion V5 - Cada acta pertenece a un movimiento.
--
-- Antes: movimiento.acta_id (un movimiento -> una acta) y el trigger de
-- inmutabilidad tenia una excepcion para llenar ese campo despues.
-- Ahora: acta.movimiento_id (un movimiento -> una o mas actas). Una
-- reasignacion genera DOS actas: la devolucion del colaborador anterior
-- y la entrega al nuevo. Asi la tabla movimiento queda 100 % inalterable,
-- sin excepciones.
--
-- Requiere V2, V3 y V4. Ejecutar con Alt+X en DBeaver.
-- =====================================================================
BEGIN;

-- Hasta ahora no se generaban actas, pero por seguridad se verifica
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM acta) THEN
        RAISE EXCEPTION 'La tabla acta ya tiene filas: revisalas antes de aplicar la V5';
    END IF;
END $$;

ALTER TABLE acta ADD COLUMN movimiento_id INTEGER NOT NULL
    CONSTRAINT fk_acta_movimiento REFERENCES movimiento(id);
CREATE INDEX idx_acta_movimiento ON acta(movimiento_id);
CREATE INDEX idx_acta_usuario    ON acta(usuario_id);

-- El detalle (copia del equipo al momento del acta) tampoco se modifica
CREATE INDEX idx_acta_detalle_acta ON acta_detalle(acta_id);

ALTER TABLE movimiento DROP COLUMN acta_id;

-- Inmutabilidad total del historial
CREATE OR REPLACE FUNCTION fn_movimiento_inalterable()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'TRUNCATE' THEN
        RAISE EXCEPTION 'El historial de movimientos es inalterable: no se permite vaciar la tabla';
    ELSIF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'El historial de movimientos es inalterable: no se permite eliminar (movimiento %)', OLD.id;
    END IF;
    RAISE EXCEPTION 'El historial de movimientos es inalterable: no se permite modificar (movimiento %)', OLD.id;
END;
$$ LANGUAGE plpgsql;

-- El detalle de cada acta es una "foto" historica: tampoco se modifica ni borra
CREATE OR REPLACE FUNCTION fn_acta_detalle_inalterable()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'El detalle de las actas es inalterable (operacion %)', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_acta_detalle_inalterable
    BEFORE UPDATE OR DELETE ON acta_detalle
    FOR EACH ROW EXECUTE FUNCTION fn_acta_detalle_inalterable();

-- Un acta no se borra (solo puede anularse cambiando su estado)
CREATE OR REPLACE FUNCTION fn_acta_sin_borrado()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Las actas no se eliminan; usa estado = ''anulada'' (acta %)', OLD.id;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_acta_sin_borrado
    BEFORE DELETE ON acta
    FOR EACH ROW EXECUTE FUNCTION fn_acta_sin_borrado();

COMMIT;
