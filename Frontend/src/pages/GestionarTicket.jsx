import { useEffect, useState } from 'react'
import api, { formatoFecha, mensajeError } from '../api/cliente'
import './GestionarTicket.css'

const estados = ['Abierto', 'En Proceso', 'Resuelto', 'Cerrado']
const claseEstado = (e) => `estado-${e.replace(' ', '-').toLowerCase()}`

function GestionarTicket() {
  const [tickets, setTickets] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [filtro, setFiltro] = useState('Abierto')
  const [seleccionadoId, setSeleccionadoId] = useState(null)

  const [comentarios, setComentarios] = useState([])
  const [nuevoComentario, setNuevoComentario] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    // RF10: Soporte ve todos los tickets
    api.get('/api/tickets')
      .then((res) => setTickets([...res.data].sort((a, b) => b.id - a.id)))
      .catch((err) => setError(mensajeError(err, 'No se pudieron cargar los tickets.')))
      .finally(() => setCargando(false))
  }, [])

  useEffect(() => {
    if (!seleccionadoId) return
    api.get(`/api/tickets/${seleccionadoId}/comentarios`)
      .then((res) => setComentarios(res.data))
      .catch((err) => alert(mensajeError(err, 'No se pudieron cargar los comentarios.')))
  }, [seleccionadoId])

  const conteos = estados.reduce((acc, e) => {
    acc[e] = tickets.filter((t) => t.estado === e).length
    return acc
  }, {})

  const ticketsFiltrados = tickets.filter((t) => t.estado === filtro)
  const ticketSeleccionado = tickets.find((t) => t.id === seleccionadoId)

  async function cambiarEstado(ticket, nuevoEstado) {
    if (nuevoEstado === ticket.estado) return
    if (nuevoEstado === 'Cerrado' && !window.confirm(`¿Cerrar el ticket #${ticket.id}? Un ticket cerrado ya no puede modificarse.`)) return
    try {
      // Al pasar a Resuelto/Cerrado el backend registra fecha_finalizacion (KPI de SLA y MTTR)
      const { data } = await api.patch(`/api/tickets/${ticket.id}/estado`, { estado: nuevoEstado })
      setTickets((prev) => prev.map((t) => (t.id === data.id ? data : t)))
    } catch (err) {
      alert(mensajeError(err, 'No se pudo cambiar el estado del ticket.'))
    }
  }

  function seleccionar(t) {
    setComentarios([])
    setNuevoComentario('')
    setSeleccionadoId(t.id)
  }

  async function guardarComentario(e) {
    e.preventDefault()
    if (!nuevoComentario.trim()) return
    setEnviando(true)
    try {
      const { data } = await api.post(`/api/tickets/${seleccionadoId}/comentarios`, { texto: nuevoComentario })
      setComentarios((prev) => [...prev, data])
      setNuevoComentario('')
    } catch (err) {
      alert(mensajeError(err, 'No se pudo guardar el comentario.'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="gt-wrap">
      <div className="gt-header">
        <div>
          <h1>Gestión de tickets — Mesa de ayuda</h1>
          <p><strong>RF10</strong> — Actualiza el estado y registra comentarios de resolución.</p>
        </div>
        <div className="gt-filtros">
          {estados.map((e) => (
            <button
              key={e}
              className={`gt-filtro${filtro === e ? ' active' : ''}`}
              onClick={() => setFiltro(e)}
            >
              {e} ({conteos[e]})
            </button>
          ))}
        </div>
      </div>

      <div className="gt-card">
        <table className="gt-table">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Colaborador</th>
              <th>Asunto</th>
              <th>Categoría</th>
              <th>Prioridad</th>
              <th>Creado</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {ticketsFiltrados.map((t) => (
              <tr
                key={t.id}
                className={t.id === seleccionadoId ? 'gt-row-activa' : ''}
                onClick={() => seleccionar(t)}
              >
                <td className="gt-id">#{t.id}</td>
                <td>{t.usuario?.nombreCompleto}</td>
                <td>{t.asunto}</td>
                <td><span className="gt-tag">{t.categoria}</span></td>
                <td>{t.prioridad}</td>
                <td>{formatoFecha(t.fechaCreacion, true)}</td>
                <td><span className={`gt-badge ${claseEstado(t.estado)}`}>{t.estado}</span></td>
                <td onClick={(e) => e.stopPropagation()}>
                  <select value={t.estado} onChange={(e) => cambiarEstado(t, e.target.value)} disabled={t.estado === 'Cerrado'}>
                    {estados.map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {!cargando && !error && ticketsFiltrados.length === 0 && (
              <tr><td colSpan={8} className="gt-vacio">No hay tickets en este estado.</td></tr>
            )}
            {cargando && <tr><td colSpan={8} className="gt-vacio">Cargando...</td></tr>}
            {error && <tr><td colSpan={8} className="gt-vacio">{error}</td></tr>}
          </tbody>
        </table>
      </div>

      {ticketSeleccionado && (
        <form className="gt-comentario-card" onSubmit={guardarComentario}>
          <h4>Ticket #{ticketSeleccionado.id} — {ticketSeleccionado.asunto}</h4>
          <p className="gt-detalle-desc">{ticketSeleccionado.descripcion || 'Sin descripción.'}</p>

          <h4>Comentarios ({comentarios.length})</h4>
          <div className="gt-comentarios">
            {comentarios.length === 0 && <div className="gt-comentario-texto">Aún no hay comentarios.</div>}
            {comentarios.map((c) => (
              <div key={c.id} className="gt-comentario">
                <div className="gt-comentario-autor">{c.autor}<span>{c.rolAutor} · {formatoFecha(c.fecha, true)}</span></div>
                <div className="gt-comentario-texto">{c.texto}</div>
              </div>
            ))}
          </div>

          {ticketSeleccionado.estado !== 'Cerrado' ? (
            <>
              <textarea
                rows={3}
                maxLength={1000}
                value={nuevoComentario}
                onChange={(e) => setNuevoComentario(e.target.value)}
                placeholder="Describe lo realizado para resolver el ticket..."
              />
              <button type="submit" disabled={enviando || !nuevoComentario.trim()}>
                {enviando ? 'Guardando...' : 'Agregar comentario'}
              </button>
            </>
          ) : (
            <div className="gt-comentario-texto">El ticket está cerrado; ya no admite comentarios.</div>
          )}
        </form>
      )}
    </div>
  )
}

export default GestionarTicket
