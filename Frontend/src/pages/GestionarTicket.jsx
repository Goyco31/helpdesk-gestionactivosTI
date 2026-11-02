import { useEffect, useState } from 'react'
import api, { mensajeError } from '../api/cliente'
import FechaHora from '../components/FechaHora'
import { claseCategoria, extraerDetalle, iniciales } from './ticketUtils'
import './GestionarTicket.css'

const estados = ['Abierto', 'En Proceso', 'Resuelto', 'Cerrado']
const filtros = ['Todos', ...estados]

const claseEstado = {
  'Abierto': 'gt-e-abierto',
  'En Proceso': 'gt-e-proceso',
  'Resuelto': 'gt-e-resuelto',
  'Cerrado': 'gt-e-cerrado',
}

function GestionarTicket() {
  const [tickets, setTickets] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [filtro, setFiltro] = useState('Todos')
  const [detalleId, setDetalleId] = useState(null)

  const [comentarios, setComentarios] = useState([])
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    // RF10: Soporte TI y Administrador ven todos los tickets
    api.get('/api/tickets')
      .then((res) => setTickets([...res.data].sort((a, b) => b.id - a.id)))
      .catch((err) => setError(mensajeError(err, 'No se pudieron cargar los tickets.')))
      .finally(() => setCargando(false))
  }, [])

  useEffect(() => {
    if (!detalleId) return
    api.get(`/api/tickets/${detalleId}/comentarios`)
      .then((res) => setComentarios(res.data))
      .catch((err) => alert(mensajeError(err, 'No se pudieron cargar los comentarios.')))
  }, [detalleId])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') setDetalleId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const ticketsFiltrados = filtro === 'Todos' ? tickets : tickets.filter((t) => t.estado === filtro)
  const detalle = tickets.find((t) => t.id === detalleId)
  const info = detalle ? extraerDetalle(detalle.descripcion) : null
  const conteo = (f) => (f === 'Todos' ? tickets.length : tickets.filter((t) => t.estado === f).length)

  function abrir(id) {
    setComentarios([])
    setComentario('')
    setDetalleId(id)
  }

  async function cambiarEstado(ticket, nuevoEstado) {
    if (nuevoEstado === ticket.estado) return
    if (nuevoEstado === 'Cerrado' && !window.confirm(`¿Cerrar el ticket #${ticket.id}? Un ticket cerrado ya no puede modificarse.`)) return
    try {
      // Al pasar a Resuelto/Cerrado el backend registra fecha_finalizacion (KPI de SLA y MTTR)
      // y, si el ticket no tenía técnico, lo asigna a quien hizo el cambio.
      const { data } = await api.patch(`/api/tickets/${ticket.id}/estado`, { estado: nuevoEstado })
      setTickets((prev) => prev.map((t) => (t.id === data.id ? data : t)))
    } catch (err) {
      alert(mensajeError(err, 'No se pudo cambiar el estado del ticket.'))
    }
  }

  async function publicar() {
    if (!comentario.trim()) return
    setEnviando(true)
    try {
      const { data } = await api.post(`/api/tickets/${detalleId}/comentarios`, { texto: comentario })
      setComentarios((prev) => [...prev, data])
      setComentario('')
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
              <th>Colaborador</th>
              <th>Categoría</th>
              <th>Asunto</th>
              <th>Prioridad</th>
              <th>Estado</th>
              <th>Abierto</th>
              <th>Cerrado</th>
            </tr>
          </thead>
          <tbody>
            {ticketsFiltrados.map((t) => (
              <tr key={t.id} onClick={() => abrir(t.id)}>
                <td>
                  <div className="gt-id">#{t.id}</div>
                  <div className="gt-ver">Ver detalle →</div>
                </td>
                <td>{t.usuario?.nombreCompleto}</td>
                <td><span className={`gt-tag gt-tag-${claseCategoria(t.categoria)}`}>{t.categoria}</span></td>
                <td>{t.asunto}</td>
                <td>{t.prioridad}</td>
                <td><span className={`gt-badge ${claseEstado[t.estado] || ''}`}>{t.estado}</span></td>
                <td><FechaHora valor={t.fechaCreacion} clase="gt" /></td>
                <td><FechaHora valor={t.fechaFinalizacion} clase="gt" /></td>
              </tr>
            ))}
            {!cargando && !error && ticketsFiltrados.length === 0 && (
              <tr className="gt-fila-vacia"><td colSpan={8} className="gt-vacio">No hay tickets en este estado.</td></tr>
            )}
            {cargando && <tr className="gt-fila-vacia"><td colSpan={8} className="gt-vacio">Cargando...</td></tr>}
            {error && <tr className="gt-fila-vacia"><td colSpan={8} className="gt-vacio">{error}</td></tr>}
          </tbody>
        </table>
      </div>

      {detalle && (
        <div className="gt-overlay" onClick={() => setDetalleId(null)}>
          <div className="gt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gt-modal-head">
              <div>
                <div className="gt-modal-idrow">
                  <span className="gt-id">#{detalle.id}</span>
                  <span className={`gt-badge ${claseEstado[detalle.estado] || ''}`}>{detalle.estado}</span>
                </div>
                <h2>{detalle.asunto}</h2>
                <p className="gt-modal-cat">{detalle.categoria}{info.subcategoria ? ` · ${info.subcategoria}` : ''}</p>
              </div>
              <button className="gt-cerrar" onClick={() => setDetalleId(null)} aria-label="Cerrar">×</button>
            </div>

            <div className="gt-info">
              <div><span>Solicitante</span><strong>{detalle.usuario?.nombreCompleto}</strong></div>
              <div><span>Prioridad</span><strong>{detalle.prioridad}</strong></div>
              <div><span>Contacto</span><strong>{info.contacto || '—'}</strong></div>
              <div>
                <span>Estado</span>
                <select
                  value={detalle.estado}
                  onChange={(e) => cambiarEstado(detalle, e.target.value)}
                  disabled={detalle.estado === 'Cerrado'}
                >
                  {estados.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div className="span2">
                <span>Atendido por</span>
                <strong>{detalle.tecnico?.nombreCompleto || 'Sin asignar (se asigna al primer cambio de estado)'}</strong>
              </div>
            </div>

            <div className="gt-body">
              <h3>Actividad y comentarios</h3>

              {detalle.estado !== 'Cerrado' ? (
                <div className="gt-composer">
                  <div className="gt-composer-fila">
                    <textarea
                      rows={3}
                      maxLength={1000}
                      placeholder="Escribe una actualización o comentario para el solicitante..."
                      value={comentario}
                      onChange={(e) => setComentario(e.target.value)}
                    />
                    <button className="gt-publicar" disabled={enviando || !comentario.trim()} onClick={publicar}>
                      {enviando ? 'Guardando...' : 'Publicar'}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="gt-cerrado-nota">El ticket está cerrado; ya no admite comentarios.</p>
              )}

              <div className="gt-timeline">
                {/* Comentarios del más reciente al más antiguo y, al final, la solicitud original */}
                {[...comentarios].reverse().map((c) => {
                  const tecnico = c.rolAutor !== 'usuario'
                  return (
                    <div key={c.id} className="gt-evento">
                      <div className={`gt-avatar ${tecnico ? 'tecnico' : ''}`}>{iniciales(c.autor)}</div>
                      <div className="gt-evento-card">
                        <div className="gt-evento-head">
                          <div>
                            <strong>{c.autor}</strong>
                            {tecnico && <small>{c.rolAutor === 'admin' ? 'Administrador' : 'Soporte TI'}</small>}
                          </div>
                          <span className="gt-evento-fecha"><FechaHora valor={c.fecha} clase="gt" enLinea /></span>
                        </div>
                        <p>{c.texto}</p>
                      </div>
                    </div>
                  )
                })}
                <div className="gt-evento">
                  <div className="gt-avatar">{iniciales(detalle.usuario?.nombreCompleto)}</div>
                  <div className="gt-evento-card">
                    <div className="gt-evento-head">
                      <div><strong>{detalle.usuario?.nombreCompleto}</strong><small>Solicitud original</small></div>
                      <span className="gt-evento-fecha"><FechaHora valor={detalle.fechaCreacion} clase="gt" enLinea /></span>
                    </div>
                    <p>{info.texto || 'Sin descripción.'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GestionarTicket
