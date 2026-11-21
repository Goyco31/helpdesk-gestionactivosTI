# Prueba de restauración de la base de datos (continuidad, sección 6.2)

Comprueba que el respaldo automático de Azure Database for PostgreSQL permite
**recuperar los datos completos e íntegros** en un servidor nuevo, sin tocar el servidor
de producción.

## 1. Tomar la referencia en producción

En DBeaver, conectado a la base del sistema, ejecuta `verificacion.sql` y guarda el
resultado (captura). Anota la **hora exacta** en que lo ejecutas.

## 2. Restaurar a un punto en el tiempo (≈ 10–20 min)

1. Portal de Azure → servidor `db-helpdesk-…` → **Overview** → **Restore**.
2. *Point-in-time*: elige una hora **posterior** a la del paso 1 (o *Latest restore point*).
3. Nombre del servidor nuevo: `db-helpdesk-restore`. Misma región y mismo tamaño.
4. Crea y espera a que el servidor quede en estado *Ready*. Anota cuánto tardó (es el
   tiempo real de recuperación, comparable con el RTO de 4 h).

## 3. Verificar la integridad

1. En el servidor restaurado, en **Networking**, agrega tu IP para poder conectarte.
2. En DBeaver, conéctate a `db-helpdesk-restore` con el mismo usuario y contraseña, y
   ejecuta `verificacion.sql` en la misma base.
3. Compara con el paso 1: los conteos y las huellas deben ser **idénticos**.

## 4. Eliminar el servidor restaurado

Un servidor restaurado cobra mientras exista: elimínalo en cuanto termines
(**Overview → Delete**). La prueba completa cuesta centavos de dólar.
