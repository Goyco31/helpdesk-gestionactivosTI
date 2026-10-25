-- =====================================================================
-- Migracion V8 - Firma electronica simple de actas (HU-18, RF08).
-- Ejecutar con Alt+X en DBeaver (requiere V2-V7).
--
-- El colaborador firma desde el portal escribiendo su nombre completo y
-- aceptando la declaracion. Se registra quien, cuando y desde que IP, y
-- se genera un PDF firmado NUEVO: el original nunca se modifica.
-- Ambos archivos quedan sellados con su huella SHA-256 para poder probar
-- que no fueron alterados.
-- =====================================================================
BEGIN;

ALTER TABLE acta ADD COLUMN hash_pdf          VARCHAR(64);        -- huella del PDF original
ALTER TABLE acta ADD COLUMN firma_nombre      VARCHAR(200);     -- nombre escrito al firmar
ALTER TABLE acta ADD COLUMN firma_fecha       TIMESTAMP;
ALTER TABLE acta ADD COLUMN firma_ip          VARCHAR(45);
ALTER TABLE acta ADD COLUMN url_pdf_firmado   VARCHAR(255) CONSTRAINT uq_acta_url_pdf_firmado UNIQUE;
ALTER TABLE acta ADD COLUMN hash_pdf_firmado  VARCHAR(64);

-- Coherencia: un acta firmada siempre tiene todos los datos de la firma
ALTER TABLE acta ADD CONSTRAINT ck_acta_firma CHECK (
    (estado = 'firmada') = (firma_fecha IS NOT NULL AND firma_nombre IS NOT NULL AND url_pdf_firmado IS NOT NULL)
);

-- Una vez firmada, el acta no puede cambiar (ni volver a pendiente ni re-firmarse)
CREATE OR REPLACE FUNCTION fn_acta_firmada_inalterable()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.estado = 'firmada' THEN
        RAISE EXCEPTION 'El acta % ya fue firmada y no puede modificarse', OLD.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_acta_firmada_inalterable
    BEFORE UPDATE ON acta
    FOR EACH ROW EXECUTE FUNCTION fn_acta_firmada_inalterable();

COMMIT;
