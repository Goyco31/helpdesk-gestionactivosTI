import { useEffect, useState } from 'react'
import api, { descargarActa, mensajeError } from '../api/cliente'
import './AsignarActivo.css'

const TICKET_VIGENTE = ['Abierto', 'En Proceso']

function manana() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

function AsignarActivo() {
  const [activos, setActivos] = useState([])
  const [tickets, setTickets] = useState([])
  const [cargando, setCargando] = useState(true)

  const [tipo, setTipo] = useState('asignar') // asignar | prestar
  const [activoId, setActivoId] = useState('')
  const [ticketId, setTicketId] = useState('')
  const [fechaDevolucion, setFechaDevolucion] = useState('')
  const [observaciones, setObservaciones] = useState('')

  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState(null)

  // Se llama al montar la pantalla y despues de cada movimiento registrado
  function cargar() {
    Promise.all([api.get('/api/activos'), api.get('/api/tickets')])
      .then(([resActivos, resTickets]) => {
        // R2: solo se ofrecen equipos "por asignar"; R1: solo tickets vigentes
        setActivos(resActivos.data.filter((a) => a.estado === 'por asignar'))
        setTickets(resTickets.data.filter((t) => TICKET_VIGENTE.includes(t.estado)).sort((a, b) => b.id - a.id))
      })
      .catch((err) => alert(mensajeError(err, 'No se pudieron cargar los activos o tickets.')))
      .finally(() => setCargando(false))
  }

  useEffect(() => { cargar() }, [])

  const activo = activos.find((a) => String(a.id) === activoId)
  const ticket = tickets.find((t) => String(t.id) === ticketId)
  const colaborador = ticket?.usuario
  const puedeConfirmar = activo && ticket && (tipo === 'asignar' || fechaDevolucion) && !enviando

  async function handleSubmit(e) {
    e.preventDefault()
    if (!puedeConfirmar) return
    setEnviando(true)
    try {
      // RF05: el backend valida ticket y disponibilidad, registra el movimiento
      // y genera el acta en PDF (RF07) en una sola transaccion
      const { data } = await api.post(`/api/movimientos/${tipo}`, {
        activoId: activo.id,
        ticketId: ticket.id,
        usuarioDestinoId: colaborador.id,
        fechaDevolucionPrevista: tipo === 'prestar' ? fechaDevolucion : null,
        observacion: observaciones,
      })
      setResultado(data)
    } catch (error) {
      console.error('Error al registrar el movimiento:', error)
      alert(mensajeError(error, 'No se pudo registrar el movimiento.'))
    } finally {
      setEnviando(false)
    }
  }

  function nuevaAsignacion() {
    setCargando(true)
    setResultado(null)
    setActivoId('')
    setTicketId('')
    setObservaciones('')
    setFechaDevolucion('')
    cargar()
  }

  if (resultado) {
    return (
      <div className="aa-wrap">
        <h1>{resultado.tipo === 'prestamo' ? 'Préstamo registrado' : 'Asignación registrada'} ✓</h1>
        <p className="aa-subtitle">
          {resultado.codigoPatrimonial} quedó a nombre de <strong>{resultado.usuarioDestino}</strong> (ticket #{resultado.ticketId}).
          Estado: <strong>{resultado.estadoAnterior}</strong> → <strong>{resultado.estadoNuevo}</strong>.
        </p>
        <div className="aa-layout">
          <div className="aa-form-card">
            <h4>Acta generada</h4>
            {resultado.actas.map((a) => (
              <div key={a.id} className="aa-resumen-grupo">
                <span>{a.tipo === 'Prestamo' ? 'Hoja de préstamo' : 'Hoja de entrega'}</span>
                <strong>{a.codigo}</strong>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button type="button" className="aa-confirmar" onClick={() => descargarActa(a.id, true)}>Ver PDF</button>
                  <button type="button" className="aa-confirmar" onClick={() => descargarActa(a.id)}>↓ Descargar</button>
                </div>
              </div>
            ))}
            <button type="button" className="aa-confirmar" style={{ marginTop: 16 }} onClick={nuevaAsignacion}>
              Registrar otra asignación
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="aa-wrap">
      <h1>Nueva asignación de activo</h1>
      <p className="aa-subtitle"><strong>RF05</strong> — Asigna un activo disponible al colaborador que lo solicitó por ticket.</p>

      <div className="aa-layout">
        <form className="aa-form-card" onSubmit={handleSubmit}>
          <div className="aa-row">
            <label>
              Tipo de entrega
              <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="asignar">Asignación</option>
                <option value="prestar">Préstamo temporal</option>
              </select>
            </label>
            {tipo === 'prestar' && (
              <label>
                Devolución prevista <span className="aa-req">*</span>
                <input type="date" min={manana()} value={fechaDevolucion}
                       onChange={(e) => setFechaDevolucion(e.target.value)} required />
              </label>
            )}
          </div>

          <label>
            N.° de ticket del Help Desk <span className="aa-req">*</span>
            <select value={ticketId} onChange={(e) => setTicketId(e.target.value)} required>
              <option value="" disabled>{cargando ? 'Cargando...' : tickets.length ? 'Selecciona el ticket...' : 'No hay tickets abiertos'}</option>
              {tickets.map((t) => (
                <option key={t.id} value={t.id}>#{t.id} — {t.asunto} ({t.usuario?.nombreCompleto})</option>
              ))}
            </select>
          </label>

          <label>
            Activo disponible <span className="aa-req">*</span>
            <select value={activoId} onChange={(e) => setActivoId(e.target.value)} required>
              <option value="" disabled>{cargando ? 'Cargando...' : activos.length ? 'Selecciona el equipo...' : 'No hay equipos por asignar'}</option>
              {activos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.codigoPatrimonial} — {a.categoria} {[a.marca, a.modelo].filter(Boolean).join(' ')}
                </option>
              ))}
            </select>
          </label>

          <label>
            Observaciones
            <textarea
              rows={3}
              placeholder="Condiciones de entrega, accesorios incluidos..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              maxLength={500}
            />
          </label>

          <button type="submit" className="aa-confirmar" disabled={!puedeConfirmar}>
            {enviando ? 'Registrando y generando acta...' : 'Confirmar y generar acta →'}
          </button>
        </form>

        <aside className="aa-resumen">
          <h4>Resumen</h4>
          <div className="aa-resumen-grupo">
            <span>Colaborador (del ticket)</span>
            <strong>{colaborador?.nombreCompleto || '—'}</strong>
            {colaborador && (
              <small>{[colaborador.area?.nombre, colaborador.sede?.nombre].filter(Boolean).join(' · ')}</small>
            )}
          </div>
          <div className="aa-resumen-grupo">
            <span>Activo</span>
            <strong>{activo ? `${activo.codigoPatrimonial} · ${activo.categoria}` : '—'}</strong>
          </div>
          <div className="aa-resumen-grupo">
            <span>Estado</span>
            <div className="aa-estado-flujo">
              <span className="aa-badge badge-disponible">por asignar</span>
              →
              <span className="aa-badge badge-asignado">{tipo === 'prestar' ? 'en préstamo' : 'en uso'}</span>
            </div>
          </div>
          <div className="aa-nota">
            Al confirmar, el sistema valida el ticket y la disponibilidad del equipo, y genera
            automáticamente la {tipo === 'prestar' ? 'hoja de préstamo' : 'hoja de entrega'} en PDF (RF07).
          </div>
        </aside>
      </div>
    </div>
  )
}

export default AsignarActivo
