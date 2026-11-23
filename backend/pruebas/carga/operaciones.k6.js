// =====================================================================
// Prueba de carga de OPERACIONES CRITICAS (capitulo X, RNF03)
// Herramienta: k6  ·  Mide asignaciones y devoluciones concurrentes; cada una
// genera su acta PDF en la misma transaccion, asi que el tiempo medido incluye
// la generacion del acta (meta RNF03: <= 3 s).
//
// IMPORTANTE: escribe en el historial inalterable. Ejecutarla SOLO contra la
// base de prueba "helpdesk_carga" (copia de la real), nunca contra la base de uso
// diario. Procedimiento completo: backend/pruebas/carga/README-operaciones.md
//
// Uso (PowerShell):
//   $env:BASE_URL="https://<tu-api>.azurewebsites.net"
//   $env:TOKEN="<token JWT de Soporte o Admin>"
//   k6 run --summary-export resultado-operaciones.json backend/pruebas/carga/operaciones.k6.js
//
// Datos: datos-carga.sql crea 10 activos K6-001..K6-010 "por asignar", un
// colaborador de prueba y 10 tickets "K6 carga" Abiertos. Cada usuario virtual
// trabaja con su propio par activo-ticket: asigna el equipo y lo devuelve.
//
// Escenarios: normal = 3 tecnicos registrando movimientos a la vez durante 2 min;
// pico = sube a 10 tecnicos simultaneos y se mantiene 2 min. Duracion: ~6 min.
// =====================================================================
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';

const BASE = __ENV.BASE_URL;
const TOKEN = __ENV.TOKEN;

const tAsignar = new Trend('t_asignacion_con_acta', true);
const tDevolver = new Trend('t_devolucion_con_acta', true);
const actasGeneradas = new Counter('actas_generadas');

export const options = {
  scenarios: {
    normal: {
      executor: 'constant-vus', vus: 3, duration: '2m', gracefulStop: '30s',
      tags: { escenario: 'normal' },
    },
    pico: {
      executor: 'ramping-vus', startTime: '2m40s', startVUs: 0, gracefulRampDown: '30s',
      tags: { escenario: 'pico' },
      stages: [
        { duration: '30s', target: 10 },
        { duration: '2m', target: 10 },
        { duration: '20s', target: 0 },
      ],
    },
  },
  thresholds: {
    't_asignacion_con_acta': ['p(95)<3000'],    // RNF03: acta en <= 3 s
    't_devolucion_con_acta': ['p(95)<3000'],
    'http_req_failed': ['rate<0.01'],          // menos de 1 % de errores
    'checks': ['rate>0.99'],
  },
};

const json = { headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' } };

export function setup() {
  if (!BASE || !TOKEN) throw new Error('Define BASE_URL y TOKEN antes de ejecutar');
  if (http.get(`${BASE}/actuator/health`).status !== 200) throw new Error('La API no responde');

  const activos = http.get(`${BASE}/api/activos`, json).json()
    .filter((a) => a.codigoPatrimonial.startsWith('K6-'))
    .sort((a, b) => a.codigoPatrimonial.localeCompare(b.codigoPatrimonial));
  const tickets = http.get(`${BASE}/api/tickets`, json).json()
    .filter((t) => t.asunto.startsWith('K6 carga') && t.estado === 'Abierto')
    .sort((a, b) => a.asunto.localeCompare(b.asunto));
  if (activos.length < 10 || tickets.length < 10) {
    throw new Error(`Faltan datos de prueba (activos K6: ${activos.length}, tickets K6: ${tickets.length}). `
      + '¿Ejecutaste datos-carga.sql en la base helpdesk_carga y la API apunta a ella?');
  }
  // Si una corrida anterior quedo a medias, los equipos asignados se devuelven primero
  return activos.map((a, i) => ({
    activoId: a.id, codigo: a.codigoPatrimonial, asignado: a.estado !== 'por asignar',
    ticketId: tickets[i].id, colaboradorId: tickets[i].usuario.id,
  }));
}

function mover(op, cuerpo, trend) {
  const r = http.post(`${BASE}/api/movimientos/${op}`, JSON.stringify(cuerpo),
    Object.assign({ tags: { op } }, json));
  const ok = check(r, {
    [`${op}: 201/200`]: (x) => x.status === 201 || x.status === 200,
    [`${op}: generó el acta`]: (x) => x.status < 300 && (x.json('actas') || []).length >= 1,
  });
  if (ok) { trend.add(r.timings.duration); actasGeneradas.add(1); }
  return ok;
}

export default function (pares) {
  const p = pares[(__VU - 1) % pares.length];
  const base = { activoId: p.activoId, ticketId: p.ticketId, observacion: 'Prueba de carga k6' };

  if (p.asignado) {   // solo en la primera vuelta, si el equipo quedo asignado
    mover('devolver', base, tDevolver);
    p.asignado = false;
  }
  if (mover('asignar', Object.assign({ usuarioDestinoId: p.colaboradorId }, base), tAsignar)) {
    sleep(1 + Math.random() * 2);   // el tecnico revisa el acta antes de la devolucion
    mover('devolver', base, tDevolver);
  }
  sleep(1 + Math.random() * 2);
}
