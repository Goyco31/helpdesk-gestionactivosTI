import { useState, useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import './MisTickets.css'

// Datos de prueba — cuando exista el backend, esto será
// un GET a /api/tickets?usuario=... con axios.
const ticketsIniciales = [
  {
    id: 'TCK-0231',
    abierto: ['30/08/2026', '08:15'],
    cerrado: ['31/08/2026', '10:42'],
    categoria: 'Hardware',
    subcategoria: 'Computadora',
    titulo: 'Laptop no enciende',
    estado: 'Resuelto',
    prioridad: 'Media',
    contacto: 'Correo corporativo',
    asignado: 'María Torres',
    actividad: [
      {
        autor: 'María Torres',
        iniciales: 'MT',
        cargo: 'Técnico de Soporte TI',
        fecha: 'Hoy, 10:42',
        tecnico: true,
        texto: 'Se realizó un reinicio eléctrico y se reemplazó el cargador. El equipo quedó operativo y fue validado antes del cierre.',
      },
      {
        autor: 'SOLICITANTE',
        iniciales: 'JF',
        texto: 'El equipo no enciende desde esta mañana, incluso conectado al cargador.',
      },
    ],
  },
  {
    id: 'TCK-0219',
    abierto: ['28/08/2026', '07:50'],
    cerrado: ['28/08/2026', '16:10'],
    categoria: 'Redes',
    subcategoria: 'Conectividad',
    titulo: 'Sin acceso a wifi de sede',
    estado: 'Resuelto',
    prioridad: 'Alta',
    contacto: 'Teléfono',
    asignado: 'María Torres',
    actividad: [
      {
        autor: 'María Torres',
        iniciales: 'MT',
        cargo: 'Técnico de Soporte TI',
        fecha: '28/08/2026, 16:10',
        tecnico: true,
        texto: 'Se restableció el acceso al punto wifi de la sede y se actualizó la contraseña de red.',
      },
      {
        autor: 'SOLICITANTE',
        iniciales: 'JF',
        texto: 'No puedo conectarme al wifi de la sede desde esta mañana.',
      },
    ],
  },
  {
    id: 'TCK-0198',
    abierto: ['02/03/2026', '09:30'],
    cerrado: ['03/03/2026', '11:20'],
    categoria: 'Hardware',
    subcategoria: 'Monitor',
    titulo: 'Solicitud de monitor adicional',
    estado: 'Cerrado',
    prioridad: 'Baja',
    contacto: 'Correo corporativo',
    asignado: 'Diego Cosme',
    actividad: [
      {
        autor: 'Diego Cosme',
        iniciales: 'DC',
        cargo: 'Técnico de Soporte TI',
        fecha: '03/03/2026, 11:20',
        tecnico: true,
        texto: 'Se entregó el monitor adicional y se generó el acta de entrega.',
      },
      {
        autor: 'SOLICITANTE',
        iniciales: 'JF',
        texto: 'Solicito un monitor adicional para mi puesto de trabajo.',
      },
    ],
  },
  {
    id: 'TCK-0177',
    abierto: ['17/02/2026', '15:40'],
    cerrado: ['18/02/2026', '09:05'],
    categoria: 'Software',
    subcategoria: 'Aplicación corporativa',
    titulo: 'Acceso a ERP comercial',
    estado: 'Cerrado',
    prioridad: 'Media',
    contacto: 'Microsoft Teams',
    asignado: 'María Torres',
    actividad: [
      {
        autor: 'María Torres',
        iniciales: 'MT',
        cargo: 'Técnico de Soporte TI',
        fecha: '18/02/2026, 09:05',
        tecnico: true,
        texto: 'Se habilitó el acceso al ERP comercial con el perfil solicitado.',
      },
      {
        autor: 'SOLICITANTE',
        iniciales: 'JF',
        texto: 'Necesito acceso al ERP comercial para el módulo de ventas.',
      },
    ],
  },
]

const estadoClase = {
  'Abierto': 'estado-abierto',
  'En proceso': 'estado-proceso',
  'Resuelto': 'estado-resuelto',
  'Cerrado': 'estado-cerrado',
}

const filtros = ['Todos', 'Abierto', 'En proceso', 'Resuelto', 'Cerrado']

function FechaHora({ valor, vacio = '—' }) {
  if (!valor) return <span className="mt-fecha-vacia">{vacio}</span>
  return (
    <div className="mt-fecha">
      <span>{valor[0]}</span>
      <small>{valor[1]}</small>
    </div>
  )
}

function ahora() {
  const d = new Date()
  const dos = (n) => String(n).padStart(2, '0')
  return [`${dos(d.getDate())}/${dos(d.getMonth() + 1)}/${d.getFullYear()}`, `${dos(d.getHours())}:${dos(d.getMinutes())}`]
}

function MisTickets() {
  const { usuario, rol } = useOutletContext()
  const navigate = useNavigate()
  const [tickets, setTickets] = useState(ticketsIniciales)
  const [filtro, setFiltro] = useState('Todos')
  const [detalleId, setDetalleId] = useState(null)

  const nombre = usuario
    .split('@')[0]
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())

  const ticketsFiltrados = filtro === 'Todos' ? tickets : tickets.filter((t) => t.estado === filtro)
  const detalle = tickets.find((t) => t.id === detalleId)

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') setDetalleId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function reabrir(id) {
    // Mientras no hay backend, simulamos la reapertura.
    // Más adelante esto será un PATCH a /api/tickets/:id/reabrir con axios.
    const [fecha, hora] = ahora()
    setTickets((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              estado: 'Abierto',
              cerrado: null,
              actividad: [
                { autor: 'SOLICITANTE', iniciales: 'JF', fecha: `${fecha}, ${hora}`, texto: 'Ticket reabierto: el problema continúa.' },
                ...t.actividad,
              ],
            }
          : t
      )
    )
  }

  const puedeReabrir = detalle && (detalle.estado === 'Resuelto' || detalle.estado === 'Cerrado')

  return (
    <div className="mt-wrap">
      <div className="mt-header">
        <div>
          <h1>Mis solicitudes de soporte</h1>
          <p>Selecciona un ticket para revisar la atención y los comentarios de Soporte.</p>
        </div>
        <button
          className="mt-nuevo"
          onClick={() => navigate('/usuario/crear-ticket', { state: { usuario, rol } })}
        >
          + Nuevo ticket
        </button>
      </div>

      <div className="mt-filtros">
        {filtros.map((f) => (
          <button
            key={f}
            className={`mt-filtro${filtro === f ? ' active' : ''}`}
            onClick={() => setFiltro(f)}
          >
            {f}
            {f === 'Todos' && <span className="mt-count">{tickets.length}</span>}
          </button>
        ))}
      </div>

      <div className="mt-card">
        <table className="mt-table">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Categoría</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th>Abierto</th>
              <th>Cerrado</th>
            </tr>
          </thead>
          <tbody>
            {ticketsFiltrados.map((t) => (
              <tr key={t.id} onClick={() => setDetalleId(t.id)}>
                <td>
                  <div className="mt-id">{t.id}</div>
                  <div className="mt-ver">Ver detalle →</div>
                </td>
                <td><span className={`mt-tag tag-${t.categoria.toLowerCase()}`}>{t.categoria}</span></td>
                <td>{t.titulo}</td>
                <td><span className={`mt-badge ${estadoClase[t.estado]}`}>{t.estado}</span></td>
                <td><FechaHora valor={t.abierto} /></td>
                <td><FechaHora valor={t.cerrado} /></td>
              </tr>
            ))}
            {ticketsFiltrados.length === 0 && (
              <tr className="mt-fila-vacia"><td colSpan={6} className="mt-vacio">No tienes tickets en este estado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {detalle && (
        <div className="mt-overlay" onClick={() => setDetalleId(null)}>
          <div className="mt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mt-modal-head">
              <div>
                <div className="mt-modal-id-row">
                  <span className="mt-id">{detalle.id}</span>
                  <span className={`mt-badge ${estadoClase[detalle.estado]}`}>{detalle.estado}</span>
                </div>
                <h2>{detalle.titulo}</h2>
                <p className="mt-modal-cat">{detalle.categoria} · {detalle.subcategoria}</p>
              </div>
              <div className="mt-modal-acciones">
                {puedeReabrir && (
                  <button className="mt-reabrir-grande" onClick={() => reabrir(detalle.id)}>
                    Reabrir ticket
                  </button>
                )}
                <button className="mt-cerrar" onClick={() => setDetalleId(null)} aria-label="Cerrar">×</button>
              </div>
            </div>

            <div className="mt-info-grid">
              <div><span>Solicitante</span><strong>{nombre}</strong></div>
              <div><span>Prioridad</span><strong>{detalle.prioridad}</strong></div>
              <div><span>Contacto</span><strong>{detalle.contacto}</strong></div>
              <div><span>Asignado a</span><strong>{detalle.asignado}</strong></div>
            </div>

            <div className="mt-modal-body">
              <h3>Actividad del ticket</h3>
              <div className="mt-timeline">
                {detalle.actividad.map((a, i) => (
                  <div key={i} className="mt-evento">
                    <div className={`mt-avatar ${a.tecnico ? 'tecnico' : ''}`}>{a.iniciales}</div>
                    <div className={`mt-evento-card ${a.tecnico ? 'destacado' : ''}`}>
                      <div className="mt-evento-head">
                        <div>
                          <strong>{a.autor === 'SOLICITANTE' ? nombre : a.autor}</strong>
                          {a.cargo && <small>{a.cargo}</small>}
                        </div>
                        {a.fecha && <span className="mt-evento-fecha">{a.fecha}</span>}
                      </div>
                      <p>{a.texto}</p>
                    </div>
                  </div>
                ))}
              </div>

              {puedeReabrir && (
                <div className="mt-banner">
                  <div>
                    <strong>¿El problema continúa?</strong>
                    <p>Puedes reabrir el ticket para que Soporte retome la atención.</p>
                  </div>
                  <button onClick={() => reabrir(detalle.id)}>Reabrir</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MisTickets