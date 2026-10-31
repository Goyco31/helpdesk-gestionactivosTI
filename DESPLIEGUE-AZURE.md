# Despliegue en Azure

| Componente | Servicio de Azure | Cómo se publica |
|---|---|---|
| Base de datos | Azure Database for PostgreSQL (servidor flexible) | Ya existe |
| API (Spring Boot) | Azure App Service · Linux · Java 17 (Java SE) | GitHub Actions: `.github/workflows/backend-azure.yml` |
| Front-End (React) | Azure App Service · Linux · Node 22 (mismo plan B1 de la API) | GitHub Actions: `.github/workflows/frontend-azure.yml` |

Los dos workflows se ejecutan solos al subir cambios a `creacion-del-frontend-con-el-backend` (o a `main`), y también a mano desde la pestaña **Actions** del repositorio.

---

## 1. Backend en Azure App Service

### 1.1 Crear el App Service
Portal de Azure → **Crear un recurso** → **Aplicación web**:

| Campo | Valor |
|---|---|
| Grupo de recursos | el mismo de la base de datos |
| Nombre | p. ej. `helpdesk-api-goyco31` → URL `https://helpdesk-api-goyco31.azurewebsites.net` |
| Publicar | **Código** |
| Pila del entorno de ejecución | **Java 17** |
| Pila del servidor web Java | **Java SE (Embedded Web Server)** |
| Sistema operativo | **Linux** |
| Región | la misma de la base de datos |
| Plan | **Básico B1** (recomendado) o **Free F1** (gratis, más lento al arrancar) |

En la pestaña **Implementación**: deja la implementación continua **deshabilitada** (usamos nuestro propio workflow) y la **autenticación básica habilitada** (la necesita el perfil de publicación).

### 1.2 Variables de entorno
App Service → **Configuración → Variables de entorno → Configuración de la aplicación**. Agrega una por una (los mismos valores de tu `.env`, sin comillas):

| Nombre | Valor |
|---|---|
| `DB_URL` | `jdbc:postgresql://<servidor>.postgres.database.azure.com:5432/postgres?sslmode=require` |
| `DB_USERNAME` | tu usuario |
| `DB_PASSWORD` | tu contraseña |
| `MAIL_USERNAME` | tu correo de Gmail |
| `MAIL_PASSWORD` | contraseña de aplicación de Gmail |
| `JWT_SECRET` | clave en Base64 (mínimo 32 bytes) |
| `ACTAS_DIR` | `/home/actas` (carpeta persistente: no se borra al reiniciar) |
| `CORS_ALLOWED_ORIGINS` | por ahora `http://localhost:5173`; en el paso 2.4 se agrega la URL del Front |

Pulsa **Aplicar**. El puerto no hace falta configurarlo: la aplicación lee la variable `PORT` que entrega Azure.

### 1.3 Ajustes recomendados
- **Configuración → Configuración general**: *Siempre activo* = **Activado** (solo en B1).
- **Supervisión → Comprobación de estado**: habilitar con la ruta `/actuator/health`.

### 1.4 Permitir que el App Service llegue a la base de datos
Servidor PostgreSQL → **Redes** → marcar **Permitir el acceso público desde cualquier servicio de Azure dentro de Azure a este servidor** → **Guardar**.

### 1.5 Conectar GitHub con el App Service
1. App Service → **Información general** → **Descargar perfil de publicación** (archivo `.PublishSettings`).
2. GitHub → repositorio → **Settings → Secrets and variables → Actions**:
   - pestaña **Secrets** → *New repository secret* → `AZURE_WEBAPP_PUBLISH_PROFILE` = todo el contenido del archivo descargado.
   - pestaña **Variables** → *New repository variable* → `AZURE_WEBAPP_NAME` = nombre del App Service (p. ej. `helpdesk-api-goyco31`).
3. Pestaña **Actions** → *Backend - Azure App Service* → **Run workflow** (o sube un cambio en `backend/`).

### 1.6 Verificar
Abre `https://<tu-app>.azurewebsites.net/actuator/health` → debe responder `{"status":"UP"}`.
El primer arranque de Spring Boot tarda alrededor de un minuto. Si falla: App Service → **Supervisión → Secuencia de registro** (Log stream).

---

## 2. Front-End en un App Service (mismo plan de la API)

> La suscripción Azure for Students no permite crear Static Web Apps (sus 5 regiones están fuera de las regiones
> autorizadas). Por eso el Front se publica en un segundo App Service dentro del **mismo plan B1** de la API:
> no tiene costo adicional y queda en Canada Central.

### 2.1 Crear el App Service del Front
Portal → **App Services** → **Create → Web App**:

| Campo | Valor |
|---|---|
| Grupo de recursos | `rg-helpdesk` |
| Nombre | p. ej. `helpdesk-web-goyco31` |
| Publicar | **Código** |
| Pila del entorno de ejecución | **Node 22 LTS** |
| Sistema operativo | **Linux** |
| Región | **Canada Central** |
| Plan de Linux | el **mismo plan** de la API (`ASP-rghelpdesk-…`) |

Pestaña **Implementación**: implementación continua deshabilitada y **autenticación básica habilitada**.
Pestaña **Supervisión**: Application Insights puede quedar deshabilitado.

### 2.2 Comando de inicio
App Service del Front → **Configuración → Configuración general** → **Comando de inicio**:

```
pm2 serve /home/site/wwwroot --no-daemon --spa
```

`--spa` hace que cualquier ruta de React (p. ej. `/soporte/asignar-activo`) devuelva `index.html`. Guardar.

### 2.3 Conectar GitHub
1. App Service del Front → **Información general** → **Descargar perfil de publicación**.
2. GitHub → **Settings → Secrets and variables → Actions**:
   - **Secret** `AZURE_FRONTEND_PUBLISH_PROFILE` = contenido del archivo descargado.
   - **Variable** `AZURE_FRONTEND_APP_NAME` = nombre del App Service del Front.
   - **Variable** `VITE_API_URL` = URL de la API, p. ej. `https://helpdesk-api-goyco31-xxxx.canadacentral-01.azurewebsites.net` (sin `/` final).
3. Pestaña **Actions** → *Frontend - Azure App Service* → **Run workflow**.

### 2.4 Autorizar el Front en la API (CORS)
App Service de la **API** → **Variables de entorno** → `CORS_ALLOWED_ORIGINS` =
`https://<url-del-front>.azurewebsites.net,http://localhost:5173` (sin espacios ni `/` final) → **Aplicar**.

No actives el CORS del portal de App Service: lo maneja Spring Security.

---

## 3. Prueba integrada
1. Abre la URL del App Service del Front e inicia sesión (llega el código 2FA al correo).
2. Registra una asignación: el acta se guarda en `/home/actas/Actas AAAA/MM - Mes/` del App Service.
3. Verifica el movimiento en DBeaver (`SELECT * FROM movimiento ORDER BY id DESC;`).

## Costos y cuidados
- Plan B1: unos USD 13 al mes (se descuenta del crédito de Azure for Students) y aloja **las dos apps** (API y Front) sin costo extra.
- Si no lo vas a usar por varios días, puedes **Detener** los App Services desde Información general (el plan sigue cobrando mientras exista).
- Nunca subas `.env` ni el perfil de publicación al repositorio.
