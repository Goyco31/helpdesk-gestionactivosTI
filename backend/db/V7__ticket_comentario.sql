-- =====================================================================
-- Migracion V7 - Comentarios de seguimiento y resolucion de tickets.
-- Ejecutar con Alt+X en DBeaver (requiere V2-V6).
-- =====================================================================
BEGIN;

CREATE TABLE ticket_comentario (
    id        SERIAL PRIMARY KEY,
    ticket_id INTEGER      NOT NULL REFERENCES ticket(id),
    autor_id  INTEGER      NOT NULL REFERENCES usuario(id),
    texto     VARCHAR(1000) NOT NULL CHECK (length(trim(texto)) > 0),
    fecha     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ticket_comentario_ticket ON ticket_comentario(ticket_id, fecha);

-- Los comentarios forman parte del historial del ticket: no se editan ni borran
CREATE OR REPLACE FUNCTION fn_comentario_inalterable()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Los comentarios de tickets no se modifican ni eliminan (operacion %)', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_comentario_inalterable
    BEFORE UPDATE OR DELETE ON ticket_comentario
    FOR EACH ROW EXECUTE FUNCTION fn_comentario_inalterable();

COMMIT;
