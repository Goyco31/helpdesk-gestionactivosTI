import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import api, { mensajeError } from '../api/cliente'
import FechaHora from '../components/FechaHora'
import { claseCategoria, extraerDetalle, iniciales } from './ticketUtils'
import './MisTickets.css'

const estadoClase = {
  'Abierto': 'estado-abierto',
  'En Proceso': 'estado-proceso',
  'Resuelto': 'estado-resuelto',
  'Cerrado': 'estado-cerrado',
}

const filtros = ['Todos', 'Abierto', 'En Proceso', 'Resuelto', 'Cerrado']

function MisTickets() {
  const { usuario, rol } = useOutletContext()
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [filtro, setFiltro] = useState('Todos')
  const [detalleId, setDetalleId] = useState(null)

  const [comentarios, setComentarios] = useState([])
  const [nuevoComentario, setNuevoComentario] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    // RF02: el backend devuelve solo los tickets del usuario autenticado
    api.get('/api/tickets')
      .then((res) => setTickets([...res.data].sort((a, b) => b.id - a.id)))
      .catch((err) => setError(mensajeError(err, 'No se pudieron cargar tus tickets.')))
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

  function abrir(id) {
    setComentarios([])
    setNuevoComentario('')
    setDetalleId(id)
  }

  async function comentar(e) {
    e.preventDefault()
    if (!nuevoComentario.trim()) return
    setEnviando(true)
    try {
      const { data } = await api.post(`/api/tickets/${detalleId}/comentarios`, { texto: nuevoComentario })
      setComentarios((prev) => [...prev, data])
      setNuevoComentario('')
    } catch (err) {
      alert(mensajeError(err, 'No se pudo enviar el comentario.'))
    } finally {
      setEnviando(false)
    }
  }

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
              <th>Asunto</th>
              <th>Estado</th>
              <th>Abierto</th>
              <th>Cerrado</th>
            </tr>
          </thead>
          <tbody>
            {ticketsFiltrados.map((t) => (
              <tr key={t.id} onClick={() => abrir(t.id)}>
                <td>
                  <div className="mt-id">#{t.id}</div>
                  <div className="mt-ver">Ver detalle →</div>
                </td>
                <td><span className={`mt-tag tag-${claseCategoria(t.categoria)}`}>{t.categoria}</span></td>
                <td>{t.asunto}</td>
                <td><span className={`mt-badge ${estadoClase[t.estado] || ''}`}>{t.estado}</span></td>
                <td><FechaHora valor={t.fechaCreacion} clase="mt" /></td>
                <td><FechaHora valor={t.fechaFinalizacion} clase="mt" /></td>
              </tr>
            ))}
            {!cargando && !error && ticketsFiltrados.length === 0 && (
              <tr className="mt-fila-vacia"><td colSpan={6} className="mt-vacio">No tienes tickets en este estado.</td></tr>
            )}
            {cargando && <tr className="mt-fila-vacia"><td colSpan={6} className="mt-vacio">Cargando...</td></tr>}
            {error && <tr className="mt-fila-vacia"><td colSpan={6} className="mt-vacio">{error}</td></tr>}
          </tbody>
        </table>
      </div>

      {detalle && (
        <div className="mt-overlay" onClick={() => setDetalleId(null)}>
          <div className="mt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mt-modal-head">
              <div>
                <div className="mt-modal-id-row">
                  <span className="mt-id">#{detalle.id}</span>
                  <span className={`mt-badge ${estadoClase[detalle.estado] || ''}`}>{detalle.estado}</span>
                </div>
                <h2>{detalle.asunto}</h2>
                <p className="mt-modal-cat">{detalle.categoria}{info.subcategoria ? ` · ${info.subcategoria}` : ''}</p>
              </div>
              <div className="mt-modal-acciones">
                <button className="mt-cerrar" onClick={() => setDetalleId(null)} aria-label="Cerrar">×</button>
              </div>
            </div>

            <div className="mt-info-grid">
              <div><span>Solicitante</span><strong>{detalle.usuario?.nombreCompleto || usuario}</strong></div>
              <div><span>Prioridad</span><strong>{detalle.prioridad}</strong></div>
              <div><span>Contacto</span><strong>{info.contacto || '—'}</strong></div>
              <div><span>Atendido por</span><strong>{detalle.tecnico?.nombreCompleto || 'Sin asignar'}</strong></div>
            </div>

            <div className="mt-modal-body">
              <h3>Actividad del ticket</h3>
              <div className="mt-timeline">
                {/* Comentarios del más reciente al más antiguo y, al final, la solicitud original */}
                {[...comentarios].reverse().map((c) => {
                  const tecnico = c.rolAutor !== 'usuario'
                  return (
                    <div key={c.id} className="mt-evento">
                      <div className={`mt-avatar ${tecnico ? 'tecnico' : ''}`}>{iniciales(c.autor)}</div>
                      <div className={`mt-evento-card ${tecnico ? 'destacado' : ''}`}>
                        <div className="mt-evento-head">
                          <div>
                            <strong>{c.autor}</strong>
                            {tecnico && <small>Soporte TI</small>}
                          </div>
                          <span className="mt-evento-fecha"><FechaHora valor={c.fecha} clase="mt" enLinea /></span>
                        </div>
                        <p>{c.texto}</p>
                      </div>
                    </div>
                  )
                })}
                <div className="mt-evento">
                  <div className="mt-avatar">{iniciales(detalle.usuario?.nombreCompleto || usuario)}</div>
                  <div className="mt-evento-card">
                    <div className="mt-evento-head">
                      <div><strong>{detalle.usuario?.nombreCompleto || usuario}</strong><small>Solicitud original</small></div>
                      <span className="mt-evento-fecha"><FechaHora valor={detalle.fechaCreacion} clase="mt" enLinea /></span>
                    </div>
                    <p>{info.texto || 'Sin descripción.'}</p>
                  </div>
                </div>
              </div>

              {detalle.estado !== 'Cerrado' ? (
                <form className="mt-banner mt-composer" onSubmit={comentar}>
                  <div>
                    <strong>¿Tienes algo que agregar?</strong>
                    <p>Si el problema continúa o tienes más información, escríbela aquí para que Soporte la revise.</p>
                    <textarea
                      rows={2}
                      maxLength={1000}
                      value={nuevoComentario}
                      onChange={(e) => setNuevoComentario(e.target.value)}
                      placeholder="Escribe tu comentario..."
                    />
                  </div>
                  <button type="submit" disabled={enviando || !nuevoComentario.trim()}>
                    {enviando ? 'Enviando...' : 'Enviar'}
                  </button>
                </form>
              ) : (
                <p className="mt-cerrado-nota">El ticket está cerrado; ya no admite comentarios.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MisTickets
