import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import './GestionarTicket.css'

const tecnicos = ['María Torres', 'Carlos Rojas', 'Diego Cosme']
const estados = ['Abierto', 'En proceso', 'Resuelto', 'Cerrado']
const filtros = ['Todos', ...estados]
const MAX_MB = 10

// Datos de prueba — cuando exista el backend, esto será
// un GET/PATCH a /api/tickets con axios.
const ticketsIniciales = [
  {
    id: 'TCK-0231', categoria: 'Hardware', subcategoria: 'Computadora', titulo: 'Laptop no enciende',
    estado: 'Resuelto', prioridad: 'Media', contacto: 'Correo corporativo',
    solicitante: 'Jose Fernandez', asignado: 'María Torres',
    abierto: ['02/09/2026', '08:35'], cerrado: ['02/09/2026', '10:42'],
    actividad: [
      { autor: 'María Torres', iniciales: 'TI', cargo: 'Soporte TI', fecha: 'Hoy, 10:42', tecnico: true,
        texto: 'Se realizó un reinicio eléctrico y se reemplazó el cargador. El equipo quedó operativo y fue validado antes del cierre.' },
      { autor: 'Jose Fernandez', iniciales: 'JF', fecha: '02/09/2026 · 08:35',
        texto: 'El equipo no enciende desde esta mañana, incluso conectado al cargador.' },
    ],
  },
  {
    id: 'TCK-0219', categoria: 'Redes', subcategoria: 'Conectividad', titulo: 'Sin acceso a wifi de sede',
    estado: 'Resuelto', prioridad: 'Alta', contacto: 'Teléfono',
    solicitante: 'Carla Mendoza', asignado: 'María Torres',
    abierto: ['01/09/2026', '14:05'], cerrado: ['01/09/2026', '17:20'],
    actividad: [
      { autor: 'María Torres', iniciales: 'TI', cargo: 'Soporte TI', fecha: '01/09/2026 · 17:20', tecnico: true,
        texto: 'Se restableció el acceso al punto wifi de la sede y se actualizó la contraseña de red.' },
      { autor: 'Carla Mendoza', iniciales: 'CM', fecha: '01/09/2026 · 14:05',
        texto: 'No puedo conectarme al wifi de la sede desde la mañana.' },
    ],
  },
  {
    id: 'TCK-0198', categoria: 'Hardware', subcategoria: 'Monitor', titulo: 'Solicitud de monitor adicional',
    estado: 'Cerrado', prioridad: 'Baja', contacto: 'Correo corporativo',
    solicitante: 'Luis Paredes', asignado: 'Diego Cosme',
    abierto: ['26/08/2026', '09:12'], cerrado: ['27/08/2026', '11:00'],
    actividad: [
      { autor: 'Diego Cosme', iniciales: 'TI', cargo: 'Soporte TI', fecha: '27/08/2026 · 11:00', tecnico: true,
        texto: 'Se entregó el monitor adicional y se generó el acta de entrega.' },
      { autor: 'Luis Paredes', iniciales: 'LP', fecha: '26/08/2026 · 09:12',
        texto: 'Solicito un monitor adicional para mi puesto de trabajo.' },
    ],
  },
  {
    id: 'TCK-0177', categoria: 'Software', subcategoria: 'Aplicación corporativa', titulo: 'Acceso a ERP comercial',
    estado: 'Cerrado', prioridad: 'Media', contacto: 'Microsoft Teams',
    solicitante: 'Carla Mendoza', asignado: 'María Torres',
    abierto: ['21/08/2026', '11:30'], cerrado: ['22/08/2026', '09:05'],
    actividad: [
      { autor: 'María Torres', iniciales: 'TI', cargo: 'Soporte TI', fecha: '22/08/2026 · 09:05', tecnico: true,
        texto: 'Se habilitó el acceso al ERP comercial con el perfil solicitado.' },
      { autor: 'Carla Mendoza', iniciales: 'CM', fecha: '21/08/2026 · 11:30',
        texto: 'Necesito acceso al ERP comercial para el módulo de ventas.' },
    ],
  },
  {
    id: 'TCK-0244', categoria: 'Software', subcategoria: 'Correo electrónico', titulo: 'Outlook no sincroniza mensajes',
    estado: 'Abierto', prioridad: 'Media', contacto: 'Correo corporativo',
    solicitante: 'Jose Fernandez', asignado: 'Sin asignar',
    abierto: ['03/09/2026', '09:18'], cerrado: null,
    actividad: [
      { autor: 'Jose Fernandez', iniciales: 'JF', fecha: '03/09/2026 · 09:18',
        texto: 'Outlook no sincroniza mis mensajes desde ayer, aparece como "Desconectado".' },
    ],
  },
  {
    id: 'TCK-0243', categoria: 'Hardware', subcategoria: 'Impresora', titulo: 'Impresora muestra atasco de papel',
    estado: 'En proceso', prioridad: 'Alta', contacto: 'Teléfono',
    solicitante: 'Luis Paredes', asignado: 'Carlos Rojas',
    abierto: ['03/09/2026', '08:10'], cerrado: null,
    actividad: [
      { autor: 'Carlos Rojas', iniciales: 'TI', cargo: 'Soporte TI', fecha: '03/09/2026 · 09:00', tecnico: true,
        texto: 'Se revisa el rodillo de la impresora y se programa su limpieza.' },
      { autor: 'Luis Paredes', iniciales: 'LP', fecha: '03/09/2026 · 08:10',
        texto: 'La impresora del piso 2 muestra atasco de papel constantemente.' },
    ],
  },
  {
    id: 'TCK-0240', categoria: 'Software', subcategoria: 'Accesos y credenciales', titulo: 'Bloqueo de acceso a intranet',
    estado: 'Abierto', prioridad: 'Media', contacto: 'Microsoft Teams',
    solicitante: 'Carla Mendoza', asignado: 'Sin asignar',
    abierto: ['02/09/2026', '17:05'], cerrado: null,
    actividad: [
      { autor: 'Carla Mendoza', iniciales: 'CM', fecha: '02/09/2026 · 17:05',
        texto: 'Me aparece bloqueado el acceso a la intranet con mi usuario.' },
    ],
  },
]

const claseEstado = {
  'Abierto': 'gt-e-abierto',
  'En proceso': 'gt-e-proceso',
  'Resuelto': 'gt-e-resuelto',
  'Cerrado': 'gt-e-cerrado',
}

function FechaHora({ valor }) {
  if (!valor) return <span className="gt-fecha-vacia">—</span>
  return (
    <div className="gt-fecha">
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

function tamano(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function extension(nombre) {
  const partes = nombre.split('.')
  return partes.length > 1 ? partes.pop().slice(0, 4).toUpperCase() : 'ARCH'
}

function GestionarTicket() {
  const { usuario, rol } = useOutletContext()
  const [tickets, setTickets] = useState(ticketsIniciales)
  const [filtro, setFiltro] = useState('Todos')
  const [detalleId, setDetalleId] = useState(null)
  const [comentario, setComentario] = useState('')
  const [adjuntos, setAdjuntos] = useState([])
  const [errorAdjunto, setErrorAdjunto] = useState('')

  const miNombre = usuario
    .split('@')[0]
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())

  const ticketsFiltrados = filtro === 'Todos' ? tickets : tickets.filter((t) => t.estado === filtro)
  const detalle = tickets.find((t) => t.id === detalleId)
  const conteo = (f) => (f === 'Todos' ? tickets.length : tickets.filter((t) => t.estado === f).length)

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') setDetalleId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function abrir(id) {
    setDetalleId(id)
    setComentario('')
    setAdjuntos([])
    setErrorAdjunto('')
  }

  function cambiarEstado(id, nuevo) {
    // Mientras no hay backend, actualizamos localmente.
    // Más adelante esto será un PATCH a /api/tickets/:id con axios.
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        const cierra = nuevo === 'Resuelto' || nuevo === 'Cerrado'
        return { ...t, estado: nuevo, cerrado: cierra ? t.cerrado || ahora() : null }
      })
    )
  }

  function asignar(id, nombre) {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, asignado: nombre } : t)))
  }

  function agregarArchivos(lista) {
    const nuevos = []
    let error = ''
    Array.from(lista || []).forEach((f) => {
      if (f.size > MAX_MB * 1024 * 1024) {
        error = `"${f.name}" supera el máximo de ${MAX_MB} MB.`
        return
      }
      nuevos.push({
        id: `${f.name}-${f.size}-${Math.random().toString(36).slice(2, 7)}`,
        name: f.name,
        size: f.size,
        url: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
      })
    })
    setErrorAdjunto(error)
    if (nuevos.length) setAdjuntos((prev) => [...prev, ...nuevos])
  }

  function quitarAdjunto(id) {
    setAdjuntos((prev) => {
      const f = prev.find((x) => x.id === id)
      if (f?.url) URL.revokeObjectURL(f.url)
      return prev.filter((x) => x.id !== id)
    })
  }

  function publicar() {
    if (!comentario.trim() && adjuntos.length === 0) return
    // Mientras no hay backend, el comentario queda solo en pantalla.
    // Más adelante esto será un POST a /api/tickets/:id/comentarios (multipart) con axios.
    const [fecha, hora] = ahora()
    const evento = {
      autor: miNombre,
      iniciales: rol === 'Administrador' ? 'AD' : 'TI',
      cargo: rol,
      fecha: `${fecha} · ${hora}`,
      tecnico: true,
      texto: comentario.trim(),
      adjuntos,
    }
    setTickets((prev) => prev.map((t) => (t.id === detalleId ? { ...t, actividad: [evento, ...t.actividad] } : t)))
    setComentario('')
    setAdjuntos([])
    setErrorAdjunto('')
  }

  return (
    <div className="gt-wrap">
      <div className="gt-header">
        <div>
          <h1>Gestión de tickets</h1>
          <p>Consulta y atiende las solicitudes registradas por todos los colaboradores.</p>
        </div>
        <div className="gt-total">
          <strong>{tickets.length}</strong>
          <span>Tickets totales</span>
        </div>
      </div>

      <div className="gt-filtros">
        {filtros.map((f) => (
          <button key={f} className={`gt-filtro${filtro === f ? ' active' : ''}`} onClick={() => setFiltro(f)}>
            {f} <span className="gt-count">{conteo(f)}</span>
          </button>
        ))}
      </div>

      <div className="gt-card">
        <table className="gt-table">
          <thead>
            <tr>
              <th>N.º de ticket</th>
              <th>Categoría</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th>Abierto</th>
              <th>Cerrado</th>
            </tr>
          </thead>
          <tbody>
            {ticketsFiltrados.map((t) => (
              <tr key={t.id} onClick={() => abrir(t.id)}>
                <td>
                  <div className="gt-id">{t.id}</div>
                  <div className="gt-ver">Ver detalle →</div>
                </td>
                <td><span className={`gt-tag gt-tag-${t.categoria.toLowerCase()}`}>{t.categoria}</span></td>
                <td>{t.titulo}</td>
                <td><span className={`gt-badge ${claseEstado[t.estado]}`}>{t.estado}</span></td>
                <td><FechaHora valor={t.abierto} /></td>
                <td><FechaHora valor={t.cerrado} /></td>
              </tr>
            ))}
            {ticketsFiltrados.length === 0 && (
              <tr className="gt-fila-vacia"><td colSpan={6} className="gt-vacio">No hay tickets en este estado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {detalle && (
        <div className="gt-overlay" onClick={() => setDetalleId(null)}>
          <div className="gt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gt-modal-head">
              <div>
                <div className="gt-modal-idrow">
                  <span className="gt-id">{detalle.id}</span>
                  <span className={`gt-badge ${claseEstado[detalle.estado]}`}>{detalle.estado}</span>
                </div>
                <h2>{detalle.titulo}</h2>
                <p className="gt-modal-cat">{detalle.categoria} · {detalle.subcategoria}</p>
              </div>
              <button className="gt-cerrar" onClick={() => setDetalleId(null)} aria-label="Cerrar">×</button>
            </div>

            <div className="gt-info">
              <div><span>Solicitante</span><strong>{detalle.solicitante}</strong></div>
              <div><span>Prioridad</span><strong>{detalle.prioridad}</strong></div>
              <div><span>Contacto</span><strong>{detalle.contacto}</strong></div>
              <div>
                <span>Estado</span>
                <select value={detalle.estado} onChange={(e) => cambiarEstado(detalle.id, e.target.value)}>
                  {estados.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div className="gt-asignar span2">
                <span>Asignar a Soporte TI</span>
                <select value={detalle.asignado} onChange={(e) => asignar(detalle.id, e.target.value)}>
                  <option value="Sin asignar">Sin asignar</option>
                  {tecnicos.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            <div className="gt-body">
              <h3>Actividad y comentarios</h3>

              <div className="gt-composer">
                <div className="gt-composer-fila">
                  <textarea
                    rows={3}
                    placeholder="Escribe una actualización o comentario para el solicitante..."
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                  />
                  <button
                    className="gt-publicar"
                    disabled={!comentario.trim() && adjuntos.length === 0}
                    onClick={publicar}
                  >
                    Publicar
                  </button>
                </div>

                <label
                  className="gt-dropzone"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); agregarArchivos(e.dataTransfer.files) }}
                >
                  <input
                    type="file"
                    multiple
                    hidden
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.log"
                    onChange={(e) => { agregarArchivos(e.target.files); e.target.value = '' }}
                  />
                  <span className="gt-clip">📎</span>
                  <span>
                    <strong>Adjuntar fotos o archivos</strong>
                    <small>Arrástralos aquí o haz clic · imágenes, PDF, Word, Excel, ZIP… (máx. {MAX_MB} MB c/u)</small>
                  </span>
                </label>

                {errorAdjunto && <div className="gt-error">{errorAdjunto}</div>}

                {adjuntos.length > 0 && (
                  <div className="gt-adjuntos">
                    {adjuntos.map((f) => (
                      <div key={f.id} className="gt-chip">
                        {f.url ? <img src={f.url} alt="" /> : <b>{extension(f.name)}</b>}
                        <span className="gt-chip-nombre">{f.name}</span>
                        <small>{tamano(f.size)}</small>
                        <button onClick={() => quitarAdjunto(f.id)} aria-label="Quitar">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="gt-timeline">
                {detalle.actividad.map((a, i) => (
                  <div key={i} className="gt-evento">
                    <div className={`gt-avatar ${a.tecnico ? 'tecnico' : ''}`}>{a.iniciales}</div>
                    <div className="gt-evento-card">
                      <div className="gt-evento-head">
                        <div>
                          <strong>{a.autor}</strong>
                          {a.cargo && <small>{a.cargo}</small>}
                        </div>
                        <span className="gt-evento-fecha">{a.fecha}</span>
                      </div>
                      {a.texto && <p>{a.texto}</p>}
                      {a.adjuntos?.length > 0 && (
                        <div className="gt-evento-adjuntos">
                          {a.adjuntos.map((f) =>
                            f.url ? (
                              <a key={f.id} href={f.url} target="_blank" rel="noreferrer" className="gt-adj-img">
                                <img src={f.url} alt={f.name} />
                                <span>{f.name}</span>
                              </a>
                            ) : (
                              <span key={f.id} className="gt-adj-file">
                                <b>{extension(f.name)}</b>
                                <span>{f.name}</span>
                                <small>{tamano(f.size)}</small>
                              </span>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GestionarTicket