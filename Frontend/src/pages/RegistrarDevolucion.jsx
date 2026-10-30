import { useEffect, useState } from 'react'
import api, { descargarActa, mensajeError } from '../api/cliente'
import './RegistrarDevolucion.css'

const TICKET_VIGENTE = ['Abierto', 'En Proceso']

const estadosDestino = [
  { valor: 'por asignar', texto: 'Disponible para reasignar' },
  { valor: 'en mantenimiento', texto: 'Enviar a mantenimiento' },
  { valor: 'para donar', texto: 'Para donar' },
  { valor: 'para baja', texto: 'Para baja' },
]

function RegistrarDevolucion() {
  const [activos, setActivos] = useState([])
  const [tickets, setTickets] = useState([])
  const [cargando, setCargando] = useState(true)

  const [activoId, setActivoId] = useState('')
  const [ticketId, setTicketId] = useState('')
  const [nuevoEstado, setNuevoEstado] = useState('por asignar')
  const [estadoFisico, setEstadoFisico] = useState('')

  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState(null)

  // Se llama al montar la pantalla y despues de cada movimiento registrado
  function cargar() {
    Promise.all([api.get('/api/activos'), api.get('/api/tickets')])
      .then(([resActivos, resTickets]) => {
        // R3: solo equipos que un colaborador tiene en su poder
        setActivos(resActivos.data.filter((a) => a.usuarioActualId != null))
        setTickets(resTickets.data.filter((t) => TICKET_VIGENTE.includes(t.estado)))
      })
      .catch((err) => alert(mensajeError(err, 'No se pudieron cargar los activos o tickets.')))
      .finally(() => setCargando(false))
  }

  useEffect(() => { cargar() }, [])

  const activo = activos.find((a) => String(a.id) === activoId)
  // R4: el ticket debe ser del colaborador que devuelve el equipo
  const ticketsDelColaborador = activo ? tickets.filter((t) => t.usuario?.id === activo.usuarioActualId) : []

  async function handleSubmit(e) {
    e.preventDefault()
    if (!activo || !ticketId) return
    setEnviando(true)
    try {
      // RF06: registra la devolucion y genera la hoja de devolucion en PDF
      const { data } = await api.post('/api/movimientos/devolver', {
        activoId: activo.id,
        ticketId: Number(ticketId),
        estadoDestino: nuevoEstado,
        observacion: estadoFisico,
      })
      setResultado(data)
    } catch (error) {
      console.error('Error al registrar la devolución:', error)
      alert(mensajeError(error, 'No se pudo registrar la devolución.'))
    } finally {
      setEnviando(false)
    }
  }

  function otraDevolucion() {
    setCargando(true)
    setResultado(null)
    setActivoId('')
    setTicketId('')
    setNuevoEstado('por asignar')
    setEstadoFisico('')
    cargar()
  }

  if (resultado) {
    return (
      <div className="rd-wrap">
        <h1>Devolución registrada ✓</h1>
        <p className="rd-subtitle">
          {resultado.codigoPatrimonial} fue devuelto por <strong>{resultado.usuarioOrigen}</strong> y quedó
          en estado <strong>{resultado.estadoNuevo}</strong> (ticket #{resultado.ticketId}).
        </p>
        <div className="rd-card">
          {resultado.actas.map((a) => (
            <div key={a.id} className="rd-field">
              <span className="rd-label">Hoja de devolución {a.codigo}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => descargarActa(a.id, true)}>Ver PDF</button>
                <button type="button" onClick={() => descargarActa(a.id)}>↓ Descargar</button>
              </div>
            </div>
          ))}
          <button type="button" onClick={otraDevolucion}>Registrar otra devolución</button>
        </div>
      </div>
    )
  }

  return (
    <div className="rd-wrap">
      <h1>Registrar devolución de activo</h1>
      <p className="rd-subtitle">
        <strong>RF06</strong> — Registra la devolución, liberando el activo o enviándolo a mantenimiento.
      </p>

      <form className="rd-card" onSubmit={handleSubmit}>
        <label>
          Activo asignado a devolver
          <select value={activoId} onChange={(e) => { setActivoId(e.target.value); setTicketId('') }} required>
            <option value="" disabled>{cargando ? 'Cargando...' : activos.length ? 'Selecciona el equipo...' : 'No hay equipos asignados'}</option>
            {activos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.codigoPatrimonial} — {[a.marca, a.modelo].filter(Boolean).join(' ')} ({a.usuarioActual}, {a.estado})
              </option>
            ))}
          </select>
        </label>

        <label>
          Ticket del colaborador
          <select value={ticketId} onChange={(e) => setTicketId(e.target.value)} required disabled={!activo}>
            <option value="" disabled>
              {!activo ? 'Primero elige el equipo' : ticketsDelColaborador.length ? 'Selecciona el ticket...' : `${activo.usuarioActual} no tiene tickets abiertos`}
            </option>
            {ticketsDelColaborador.map((t) => (
              <option key={t.id} value={t.id}>#{t.id} — {t.asunto}</option>
            ))}
          </select>
        </label>

        <div className="rd-field">
          <span className="rd-label">Nuevo estado del activo</span>
          <div className="rd-opciones">
            {estadosDestino.map((e) => (
              <label key={e.valor} className={`rd-opcion${nuevoEstado === e.valor ? ' active' : ''}`}>
                <input
                  type="radio"
                  name="estado"
                  checked={nuevoEstado === e.valor}
                  onChange={() => setNuevoEstado(e.valor)}
                />
                {e.texto}
              </label>
            ))}
          </div>
        </div>

        <label>
          Estado físico observado
          <textarea
            rows={3}
            placeholder="Ej. equipo operativo, sin daños visibles."
            value={estadoFisico}
            onChange={(e) => setEstadoFisico(e.target.value)}
            maxLength={500}
          />
        </label>

        <button type="submit" disabled={!activo || !ticketId || enviando}>
          {enviando ? 'Registrando y generando acta...' : 'Registrar devolución y generar acta'}
        </button>
      </form>
    </div>
  )
}

export default RegistrarDevolucion
