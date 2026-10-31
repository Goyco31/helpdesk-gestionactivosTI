# Despliegue en Azure

| Componente | Servicio de Azure | Cómo se publica |
|---|---|---|
| Base de datos | Azure Database for PostgreSQL (servidor flexible) | Ya existe |
| API (Spring Boot) | Azure App Service · Linux · Java 17 (Java SE) | GitHub Actions: `.github/workflows/backend-azure.yml` |
| Front-End (React) | Azure Static Web Apps (plan Free) | GitHub Actions: `.github/workflows/frontend-azure.yml` |

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

## 2. Front-End en Azure Static Web Apps

### 2.1 Crear el Static Web App
Portal → **Crear un recurso** → **Static Web App**:

| Campo | Valor |
|---|---|
| Nombre | p. ej. `helpdesk-web-goyco31` |
| Plan | **Free** |
| Origen de la implementación | **Otro** (usamos nuestro propio workflow) |

### 2.2 Conectar GitHub
1. Static Web App → **Información general** → **Administrar token de implementación** → copiar.
2. GitHub → **Settings → Secrets and variables → Actions**:
   - **Secret** `AZURE_STATIC_WEB_APPS_API_TOKEN` = el token copiado.
   - **Variable** `VITE_API_URL` = `https://<tu-app>.azurewebsites.net` (sin `/` al final).

### 2.3 Publicar
Pestaña **Actions** → *Frontend - Azure Static Web Apps* → **Run workflow**. La URL del sitio aparece en **Información general** del Static Web App (`https://<nombre>.azurestaticapps.net`).

### 2.4 Autorizar el Front en la API (CORS)
App Service → **Variables de entorno** → `CORS_ALLOWED_ORIGINS` =
`https://<nombre>.azurestaticapps.net,http://localhost:5173` (sin espacios ni `/` final) → **Aplicar** (la app se reinicia sola).

No actives el CORS del portal de App Service: lo maneja Spring Security.

---

## 3. Prueba integrada
1. Abre la URL del Static Web App e inicia sesión (llega el código 2FA al correo).
2. Registra una asignación: el acta se guarda en `/home/actas/Actas AAAA/MM - Mes/` del App Service.
3. Verifica el movimiento en DBeaver (`SELECT * FROM movimiento ORDER BY id DESC;`).

## Costos y cuidados
- Static Web Apps Free: gratis. App Service B1: unos USD 13 al mes (se descuenta del crédito de Azure for Students); F1: gratis con límite de 60 minutos de CPU al día.
- Si no lo vas a usar por varios días, puedes **Detener** el App Service desde Información general.
- Nunca subas `.env` ni el perfil de publicación al repositorio.
