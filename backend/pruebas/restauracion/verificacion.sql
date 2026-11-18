-- =====================================================================
-- Verificacion de integridad para la prueba de restauracion.
-- Ejecutar en la base de produccion y en la restaurada: los resultados
-- deben ser identicos (mismos conteos y mismas huellas MD5 por tabla).
-- Solo lee datos; no modifica nada.
-- =====================================================================
SELECT 'usuario'     AS tabla, count(*) AS filas, md5(string_agg(id::text || correo, ',' ORDER BY id)) AS huella FROM usuario
UNION ALL
SELECT 'activo',      count(*), md5(string_agg(id::text || codigo_patrimonial || estado_id, ',' ORDER BY id)) FROM activo
UNION ALL
SELECT 'ticket',      count(*), md5(string_agg(id::text || estado || coalesce(fecha_finalizacion::text, ''), ',' ORDER BY id)) FROM ticket
UNION ALL
SELECT 'movimiento',  count(*), md5(string_agg(id::text || tipo || activo_id || ticket_id, ',' ORDER BY id)) FROM movimiento
UNION ALL
SELECT 'acta',        count(*), md5(string_agg(id::text || coalesce(hash_pdf, ''), ',' ORDER BY id)) FROM acta
ORDER BY tabla;
