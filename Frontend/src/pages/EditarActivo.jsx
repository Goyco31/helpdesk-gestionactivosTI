import { useEffect, useState } from 'react'
import api, { claseEstadoActivo, mensajeError } from '../api/cliente'
import { useCatalogo } from '../api/catalogos'
import './EditarActivo.css'

const TICKET_VIGENTE = ['Abierto', 'En Proceso']
const ESTADOS_ALMACEN = ['por asignar', 'en mantenimiento', 'para donar', 'para baja', 'de baja']

function EditarActivo() {
  const { items: categorias } = useCatalogo('categorias')
  const { items: sedes } = useCatalogo('sedes')
  const { items: sociedades } = useCatalogo('sociedades')

  const [activos, setActivos] = useState([])
  const [tickets, setTickets] = useState([])
  const [cargando, setCargando] = useState(true)
  const [seleccionadoId, setSeleccionadoId] = useState('')
  const [form, setForm] = useState({ categoria: '', marca: '', modelo: '', numeroSerie: '', sede: '', sociedad: '' })
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)

  // Cambio de estado (requiere ticket, queda en el historial)
  const [nuevoEstado, setNuevoEstado] = useState('')
  const [ticketId, setTicketId] = useState('')
  const [motivo, setMotivo] = useState('')
  const [cambiando, setCambiando] = useState(false)

  function cargar() {
    Promise.all([api.get('/api/activos'), api.get('/api/tickets')])
      .then(([a, t]) => {
        setActivos(a.data)
        setTickets(t.data.filter((x) => TICKET_VIGENTE.includes(x.estado)).sort((x, y) => y.id - x.id))
      })
      .catch((err) => alert(mensajeError(err, 'No se pudieron cargar los activos.')))
      .finally(() => setCargando(false))
  }

  useEffect(() => { cargar() }, [])

  const activo = activos.find((a) => String(a.id) === seleccionadoId)
  const asignado = activo?.usuarioActualId != null

  function seleccionar(id) {
    const a = activos.find((x) => String(x.id) === id)
    setSeleccionadoId(id)
    setForm({
      categoria: a?.categoria || '',
      marca: a?.marca || '',
      modelo: a?.modelo || '',
      numeroSerie: a?.numeroSerie || '',
      sede: a?.sede || '',
      sociedad: a?.sociedad || '',
    })
    setGuardado(false)
    setNuevoEstado('')
    setTicketId('')
    setMotivo('')
  }

  function cambiar(campo, valor) {
    setForm({ ...form, [campo]: valor })
    setGuardado(false)
  }

  async function guardarCambios(e) {
    e.preventDefault()
    if (!activo) return
    setGuardando(true)
    try {
      // RF04: edita los datos; las actas ya emitidas conservan su propia copia
      const { data } = await api.put(`/api/activos/${activo.id}`, form)
      setActivos((prev) => prev.map((a) => (a.id === data.id ? data : a)))
      setGuardado(true)
    } catch (err) {
      alert(mensajeError(err, 'No se pudieron guardar los cambios.'))
    } finally {
      setGuardando(false)
    }
  }

  async function cambiarEstado() {
    if (!activo || !nuevoEstado || !ticketId) return
    const aviso = nuevoEstado === 'de baja'
      ? `¿Dar de baja el activo ${activo.codigoPatrimonial}? Esta acción es definitiva: no podrá volver a asignarse.`
      : `¿Cambiar el estado de ${activo.codigoPatrimonial} a "${nuevoEstado}"?`
    if (!window.confirm(aviso)) return
    setCambiando(true)
    try {
      await api.post('/api/movimientos/cambiar-estado', {
        activoId: activo.id,
        ticketId: Number(ticketId),
        estadoDestino: nuevoEstado,
        observacion: motivo,
      })
      alert('Estado actualizado y registrado en el historial.')
      setSeleccionadoId('')
      setCargando(true)
      cargar()
    } catch (err) {
      alert(mensajeError(err, 'No se pudo cambiar el estado.'))
    } finally {
      setCambiando(false)
    }
  }

  return (
    <div className="ea-wrap">
      <h1>Editar / dar de baja activo</h1>
      <p className="ea-subtitle"><strong>RF04</strong> — Actualiza los datos de un activo o cambia su estado (mantenimiento, donación, baja).</p>

      <div className="ea-layout">
        <form className="ea-card" onSubmit={guardarCambios}>
          <label>
            Activo
            <select value={seleccionadoId} onChange={(e) => seleccionar(e.target.value)}>
              <option value="" disabled>{cargando ? 'Cargando...' : 'Selecciona el activo...'}</option>
              {activos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.codigoPatrimonial} — {[a.marca, a.modelo].filter(Boolean).join(' ')} ({a.estado})
                </option>
              ))}
            </select>
          </label>

          {activo && (
            <>
              <div className="ea-row">
                <label>
                  Categoría
                  <select value={form.categoria} onChange={(e) => cambiar('categoria', e.target.value)}>
                    {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label>
                  N.° de serie
                  <input type="text" value={form.numeroSerie} onChange={(e) => cambiar('numeroSerie', e.target.value)} />
                </label>
              </div>

              <div className="ea-row">
                <label>
                  Marca
                  <input type="text" value={form.marca} onChange={(e) => cambiar('marca', e.target.value)} />
                </label>
                <label>
                  Modelo
                  <input type="text" value={form.modelo} onChange={(e) => cambiar('modelo', e.target.value)} />
                </label>
              </div>

              <div className="ea-row">
                <label>
                  Sede
                  <select value={form.sede} onChange={(e) => cambiar('sede', e.target.value)}>
                    <option value="" disabled>Selecciona...</option>
                    {sedes.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                <label>
                  Sociedad
                  <select value={form.sociedad} onChange={(e) => cambiar('sociedad', e.target.value)}>
                    <option value="" disabled>Selecciona...</option>
                    {sociedades.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
              </div>

              <div className="ea-estado-actual">
                Estado actual:{' '}
                <span className={`ea-badge estado-${claseEstadoActivo(activo.estado)}`}>{activo.estado}</span>
                {asignado && <> · asignado a <strong>{activo.usuarioActual}</strong></>}
              </div>

              <button type="submit" className="ea-guardar" disabled={guardando}>
                {guardando ? 'Guardando...' : guardado ? 'Cambios guardados ✓' : 'Guardar cambios'}
              </button>
            </>
          )}
        </form>

        <div className="ea-peligro">
          <h4>Cambiar estado / dar de baja</h4>
          {!activo && <p>Selecciona un activo para cambiar su estado.</p>}
          {activo && asignado && (
            <p>Este equipo lo tiene <strong>{activo.usuarioActual}</strong>. Primero registra su devolución.</p>
          )}
          {activo && !asignado && (
            <>
              <p>El cambio queda en el historial del activo y debe estar vinculado a un ticket. «De baja» es definitivo.</p>
              <label>
                Nuevo estado
                <select value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value)}>
                  <option value="" disabled>Selecciona...</option>
                  {ESTADOS_ALMACEN.filter((e) => e !== activo.estado).map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </label>
              <label>
                Ticket
                <select value={ticketId} onChange={(e) => setTicketId(e.target.value)}>
                  <option value="" disabled>{tickets.length ? 'Selecciona el ticket...' : 'No hay tickets abiertos'}</option>
                  {tickets.map((t) => <option key={t.id} value={t.id}>#{t.id} — {t.asunto}</option>)}
                </select>
              </label>
              <label>
                Motivo
                <textarea rows={2} maxLength={500} value={motivo} onChange={(e) => setMotivo(e.target.value)}
                          placeholder="Ej. pantalla dañada, equipo obsoleto..." />
              </label>
              <button type="button" onClick={cambiarEstado} disabled={!nuevoEstado || !ticketId || cambiando}>
                {cambiando ? 'Registrando...' : nuevoEstado === 'de baja' ? 'Dar de baja este activo' : 'Cambiar estado'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default EditarActivo
