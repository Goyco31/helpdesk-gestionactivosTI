# Prueba de carga de operaciones críticas (asignación, devolución y actas PDF)

Mide cuánto tardan las **asignaciones y devoluciones concurrentes**, cada una con la
**generación de su acta PDF** en la misma transacción (RNF03: ≤ 3 s), sobre el mismo
plan B1 y el mismo servidor PostgreSQL de producción.

Como estas operaciones escriben en el historial inalterable, la prueba se ejecuta contra
una **copia temporal de la base** (`helpdesk_carga`) que se elimina al final. La base de
uso diario no recibe ningún dato de prueba.

## 1. Crear la copia de la base (≈ 5 min)

1. En el portal de Azure, **detén** `helpdesk-api` (botón *Stop*). Una base solo se puede
   copiar si nadie está conectado a ella.
2. En DBeaver, cierra la conexión a la base del sistema y abre una conexión a la base
   `postgres` del mismo servidor. Ejecuta (reemplaza `<base_real>` por el nombre que
   aparece al final de tu `DB_URL`):
   ```sql
   CREATE DATABASE helpdesk_carga TEMPLATE <base_real>;
   ```
3. Conéctate a `helpdesk_carga` y ejecuta `datos-carga.sql`. La última consulta debe
   mostrar `10 | 10`.

## 2. Apuntar la API a la copia

1. En `helpdesk-api` → **Configuración → Variables de entorno**, cambia en `DB_URL` solo
   el nombre de la base: `.../<base_real>?sslmode=require` → `.../helpdesk_carga?sslmode=require`.
   Guarda.
2. **Inicia** `helpdesk-api` y espera a que `/actuator/health` responda `UP`.
3. Inicia sesión en el front con un usuario Soporte o Admin y copia el token
   (`copy(localStorage.getItem('token'))` en la consola del navegador).

## 3. Ejecutar la prueba (≈ 6 min)

```powershell
k6 run -e BASE_URL=https://<tu-api>.azurewebsites.net -e TOKEN=<token> `
  --summary-export resultado-operaciones.json backend/pruebas/carga/operaciones.k6.js
```

Captura el resumen: `t_asignacion_con_acta`, `t_devolucion_con_acta`, `actas_generadas`,
`http_req_failed` y `checks`. Captura también **Metrics** del App Service (CPU, memoria,
Response Time) y el **Log stream** con las líneas `Acta ... generada en N ms`.

## 4. Volver a la base real y borrar la copia

1. Devuelve `DB_URL` a `.../<base_real>?sslmode=require` y guarda (la API se reinicia).
2. Comprueba `/actuator/health` = `UP` e inicia sesión en el sistema.
3. En DBeaver, conectado a `postgres`:
   ```sql
   DROP DATABASE helpdesk_carga;
   ```
4. Las actas PDF de prueba quedaron en la carpeta o contenedor de actas con códigos de los
   activos `K6-…`; se pueden borrar desde Kudu o desde el contenedor de Blob Storage.
