import { useEffect, useState } from 'react'
import api, { descargarActa, mensajeError } from '../api/cliente'
import './AsignarActivo.css'

const TICKET_VIGENTE = ['Abierto', 'En Proceso']

/**
 * Traslada un equipo "en uso" de un colaborador a otro sin pasar por almacén.
 * Genera dos actas: devolución del anterior y entrega al nuevo.
 */
function ReasignarActivo() {
  const [activos, setActivos] = useState([])
  const [tickets, setTickets] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)

  const [activoId, setActivoId] = useState('')
  const [destinoId, setDestinoId] = useState('')
  const [ticketId, setTicketId] = useState('')
  const [observacion, setObservacion] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState(null)

  // Se llama al montar la pantalla y despues de cada reasignacion
  function cargar() {
    Promise.all([api.get('/api/activos'), api.get('/api/tickets'), api.get('/api/usuarios')])
      .then(([a, t, u]) => {
        setActivos(a.data.filter((x) => x.estado === 'en uso'))
        setTickets(t.data.filter((x) => TICKET_VIGENTE.includes(x.estado)))
        setUsuarios(u.data)
      })
      .catch((err) => alert(mensajeError(err, 'No se pudieron cargar los datos.')))
      .finally(() => setCargando(false))
  }

  useEffect(() => { cargar() }, [])

  const activo = activos.find((a) => String(a.id) === activoId)
  const destino = usuarios.find((u) => String(u.id) === destinoId)
  // El ticket debe ser del colaborador anterior o del nuevo
  const ticketsValidos = activo
    ? tickets.filter((t) => t.usuario?.id === activo.usuarioActualId || (destino && t.usuario?.id === destino.id))
    : []

  async function handleSubmit(e) {
    e.preventDefault()
    if (!activo || !destino || !ticketId) return
    setEnviando(true)
    try {
      const { data } = await api.post('/api/movimientos/reasignar', {
        activoId: activo.id,
        ticketId: Number(ticketId),
        usuarioDestinoId: destino.id,
        observacion,
      })
      setResultado(data)
    } catch (err) {
      alert(mensajeError(err, 'No se pudo reasignar el activo.'))
    } finally {
      setEnviando(false)
    }
  }

  function otra() {
    setResultado(null)
    setActivoId('')
    setDestinoId('')
    setTicketId('')
    setObservacion('')
    setCargando(true)
    cargar()
  }

  if (resultado) {
    return (
      <div className="aa-wrap">
        <h1>Reasignación registrada ✓</h1>
        <p className="aa-subtitle">
          {resultado.codigoPatrimonial} pasó de <strong>{resultado.usuarioOrigen}</strong> a{' '}
          <strong>{resultado.usuarioDestino}</strong> (ticket #{resultado.ticketId}).
        </p>
        <div className="aa-layout">
          <div className="aa-form-card">
            <h4>Actas generadas</h4>
            {resultado.actas.map((a) => (
              <div key={a.id} className="aa-resumen-grupo">
                <span>{a.tipo === 'Devolucion' ? 'Hoja de devolución (anterior)' : 'Hoja de entrega (nuevo)'}</span>
                <strong>{a.codigo}</strong>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button type="button" className="aa-confirmar" onClick={() => descargarActa(a.id, true)}>Ver PDF</button>
                  <button type="button" className="aa-confirmar" onClick={() => descargarActa(a.id)}>↓ Descargar</button>
                </div>
              </div>
            ))}
            <button type="button" className="aa-confirmar" style={{ marginTop: 16 }} onClick={otra}>
              Registrar otra reasignación
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="aa-wrap">
      <h1>Reasignar activo</h1>
      <p className="aa-subtitle">Traslada un equipo en uso de un colaborador a otro. Se generan la hoja de devolución y la de entrega.</p>

      <div className="aa-layout">
        <form className="aa-form-card" onSubmit={handleSubmit}>
          <label>
            Activo en uso <span className="aa-req">*</span>
            <select value={activoId} onChange={(e) => { setActivoId(e.target.value); setTicketId('') }} required>
              <option value="" disabled>{cargando ? 'Cargando...' : activos.length ? 'Selecciona el equipo...' : 'No hay equipos en uso'}</option>
              {activos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.codigoPatrimonial} — {[a.marca, a.modelo].filter(Boolean).join(' ')} ({a.usuarioActual})
                </option>
              ))}
            </select>
          </label>

          <label>
            Nuevo colaborador <span className="aa-req">*</span>
            <select value={destinoId} onChange={(e) => { setDestinoId(e.target.value); setTicketId('') }} required disabled={!activo}>
              <option value="" disabled>{activo ? 'Selecciona al colaborador...' : 'Primero elige el equipo'}</option>
              {usuarios.filter((u) => u.id !== activo?.usuarioActualId).map((u) => (
                <option key={u.id} value={u.id}>{u.nombreCompleto}{u.area ? ` — ${u.area}` : ''}</option>
              ))}
            </select>
          </label>

          <label>
            Ticket <span className="aa-req">*</span>
            <select value={ticketId} onChange={(e) => setTicketId(e.target.value)} required disabled={!activo || !destino}>
              <option value="" disabled>
                {!activo || !destino ? 'Elige equipo y colaborador' : ticketsValidos.length ? 'Selecciona el ticket...' : 'Ninguno de los dos tiene tickets abiertos'}
              </option>
              {ticketsValidos.map((t) => (
                <option key={t.id} value={t.id}>#{t.id} — {t.asunto} ({t.usuario?.nombreCompleto})</option>
              ))}
            </select>
          </label>

          <label>
            Observaciones
            <textarea rows={3} maxLength={500} value={observacion} onChange={(e) => setObservacion(e.target.value)}
                      placeholder="Motivo de la reasignación, estado del equipo..." />
          </label>

          <button type="submit" className="aa-confirmar" disabled={!activo || !destino || !ticketId || enviando}>
            {enviando ? 'Registrando y generando actas...' : 'Reasignar y generar actas →'}
          </button>
        </form>

        <aside className="aa-resumen">
          <h4>Resumen</h4>
          <div className="aa-resumen-grupo"><span>Colaborador actual</span><strong>{activo?.usuarioActual || '—'}</strong></div>
          <div className="aa-resumen-grupo"><span>Nuevo colaborador</span><strong>{destino?.nombreCompleto || '—'}</strong></div>
          <div className="aa-nota">El equipo permanece «en uso». Se generan dos actas: devolución del colaborador actual y entrega al nuevo.</div>
        </aside>
      </div>
    </div>
  )
}

export default ReasignarActivo
