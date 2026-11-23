// =====================================================================
// Prueba de carga de consultas (capitulo X: capacidad y rendimiento)
// Herramienta: k6 (https://k6.io)  ·  Instalar en Windows:  winget install k6
//
// Solo hace CONSULTAS (GET). No crea movimientos ni actas: el historial
// es inalterable y cada registro de prueba quedaria para siempre en la BD.
// Tampoco prueba el login: cada login envia un correo 2FA por Gmail.
//
// Uso (PowerShell):
//   $env:BASE_URL="https://<tu-api>.azurewebsites.net"
//   $env:TOKEN="<token JWT de un usuario Soporte o Admin>"   # localStorage 'token' del navegador
//   k6 run --summary-export resultado.json backend/pruebas/carga/consultas.k6.js
//
// Escenarios (sección 10.1): normal = 10 usuarios simultaneos durante 3 min;
// pico = sube a 30 usuarios y se mantiene 3 min. Duracion total: ~8 min.
// =====================================================================
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE_URL;
const TOKEN = __ENV.TOKEN;

export const options = {
  scenarios: {
    normal: { executor: 'constant-vus', vus: 10, duration: '3m', tags: { escenario: 'normal' } },
    pico: {
      executor: 'ramping-vus', startTime: '3m30s', startVUs: 10, tags: { escenario: 'pico' },
      stages: [
        { duration: '1m', target: 30 },
        { duration: '3m', target: 30 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    'http_req_duration{escenario:normal}': ['p(95)<2000'],   // KPI: P95 de consultas <= 2 s
    'http_req_duration{escenario:pico}': ['p(95)<3000'],     // pico: <= 3 s
    http_req_failed: ['rate<0.01'],                          // menos de 1 % de errores
  },
};

export function setup() {
  if (!BASE || !TOKEN) throw new Error('Define BASE_URL y TOKEN antes de ejecutar');
  const r = http.get(`${BASE}/actuator/health`);
  if (r.status !== 200) throw new Error(`La API no responde (health = ${r.status})`);
}

const params = (nombre) => ({ headers: { Authorization: `Bearer ${TOKEN}` }, tags: { endpoint: nombre } });

export default function () {
  const res = http.batch([
    ['GET', `${BASE}/api/activos`, null, params('activos')],
    ['GET', `${BASE}/api/tickets`, null, params('tickets')],
    ['GET', `${BASE}/api/actas`, null, params('actas')],
  ]);
  res.forEach((r) => check(r, { 'status 200': (x) => x.status === 200 }));
  sleep(2 + Math.random() * 3);   // tiempo de lectura de un usuario real (2 a 5 s)
}
