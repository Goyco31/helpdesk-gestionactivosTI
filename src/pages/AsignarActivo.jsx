import { useState } from 'react'
import './AsignarActivo.css'

const activosDisponibles = [
  { codigo: 'TP-CP-00089', nombre: 'HP EliteDesk 800' },
]
const sedes = ['Sede Lima Central', 'Sede Callao', 'Sede Arequipa']

function AsignarActivo() {
  const [activo, setActivo] = useState(activosDisponibles[0].codigo)
  const [colaborador, setColaborador] = useState('')
  const [sede, setSede] = useState(sedes[1])
  const [ticket, setTicket] = useState('')
  const [validado, setValidado] = useState(false)
  const [observaciones, setObservaciones] = useState('')
  const [confirmado, setConfirmado] = useState(false)

  const activoSeleccionado = activosDisponibles.find((a) => a.codigo === activo)
  const puedeConfirmar = colaborador.trim() && validado && observaciones.trim()

  function validarTicket() {
    if (ticket.trim()) setValidado(true)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!puedeConfirmar) return
    // Mientras no hay backend, simulamos la asignación.
    // Más adelante esto será un POST a /api/activos/:codigo/asignar con axios,
    // que además disparará la generación del acta (RF07).
    setConfirmado(true)
  }

  return (
    <div className="aa-wrap">
      <h1>Nueva asignación de activo</h1>
      <p className="aa-subtitle"><strong>RF05</strong> — Asigna un activo disponible a un colaborador o sede.</p>

      <div className="aa-layout">
        <form className="aa-form-card" onSubmit={handleSubmit}>
          <label>
            Activo disponible
            <select value={activo} onChange={(e) => setActivo(e.target.value)}>
              {activosDisponibles.map((a) => (
                <option key={a.codigo} value={a.codigo}>{a.codigo} — {a.nombre} (Disponible)</option>
              ))}
            </select>
          </label>

          <div className="aa-row">
            <label>
              Colaborador
              <input type="text" placeholder="Nombre del colaborador" value={colaborador} onChange={(e) => setColaborador(e.target.value)} required />
            </label>
            <label>
              Sede
              <select value={sede} onChange={(e) => setSede(e.target.value)}>
                {sedes.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>

          <label>
            N.° de ticket del Help Desk <span className="aa-req">*</span>
            <div className="aa-ticket-row">
              <input
                type="text"
                placeholder="Ej. TCK-030"
                value={ticket}
                onChange={(e) => { setTicket(e.target.value); setValidado(false) }}
              />
              <button type="button" onClick={validarTicket} disabled={!ticket.trim()}>
                {validado ? '✓ Validado' : 'Validar'}
              </button>
            </div>
          </label>

          <label>
            Observaciones
            <textarea
              rows={3}
              className={!observaciones.trim() ? 'aa-textarea-pendiente' : ''}
              placeholder="Condiciones de entrega, accesorios incluidos..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </label>

          <button type="submit" className="aa-confirmar" disabled={!puedeConfirmar}>
            {confirmado ? 'Asignación confirmada ✓' : 'Confirmar asignación y generar acta →'}
          </button>
        </form>

        <aside className="aa-resumen">
          <h4>Resumen</h4>
          <div className="aa-resumen-grupo">
            <span>Activo</span>
            <strong>{activoSeleccionado.nombre} · {activoSeleccionado.codigo}</strong>
          </div>
          <div className="aa-resumen-grupo">
            <span>Estado actual</span>
            <div className="aa-estado-flujo">
              <span className="aa-badge badge-disponible">Disponible</span>
              →
              <span className="aa-badge badge-asignado">Asignado</span>
            </div>
          </div>
          <div className="aa-resumen-grupo">
            <span>Vinculado a</span>
            <strong>{ticket.trim() || '—'}</strong>
          </div>
          <div className="aa-nota">
            Al confirmar, el sistema generará automáticamente el acta de entrega en PDF (RF07).
          </div>
        </aside>
      </div>
    </div>
  )
}

export default AsignarActivo