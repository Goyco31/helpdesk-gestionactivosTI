import { useState } from 'react'
import './RegistrarDevolucion.css'

const activosAsignados = [
  { codigo: 'TP-LT-00231', nombre: 'Dell Latitude 5440', colaborador: 'J. Fernandez' },
]

function RegistrarDevolucion() {
  const [activo, setActivo] = useState(activosAsignados[0].codigo)
  const [nuevoEstado, setNuevoEstado] = useState('disponible')
  const [estadoFisico, setEstadoFisico] = useState('')
  const [registrado, setRegistrado] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    // Mientras no hay backend, simulamos la devolución.
    // Más adelante esto será un POST a /api/activos/:codigo/devolver con axios.
    setRegistrado(true)
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
          <select value={activo} onChange={(e) => setActivo(e.target.value)}>
            {activosAsignados.map((a) => (
              <option key={a.codigo} value={a.codigo}>{a.codigo} — {a.nombre} ({a.colaborador})</option>
            ))}
          </select>
        </label>

        <div className="rd-field">
          <span className="rd-label">Nuevo estado del activo</span>
          <div className="rd-opciones">
            <label className={`rd-opcion${nuevoEstado === 'disponible' ? ' active' : ''}`}>
              <input
                type="radio"
                name="estado"
                checked={nuevoEstado === 'disponible'}
                onChange={() => setNuevoEstado('disponible')}
              />
              Disponible para reasignar
            </label>
            <label className={`rd-opcion${nuevoEstado === 'mantenimiento' ? ' active' : ''}`}>
              <input
                type="radio"
                name="estado"
                checked={nuevoEstado === 'mantenimiento'}
                onChange={() => setNuevoEstado('mantenimiento')}
              />
              Enviar a mantenimiento
            </label>
          </div>
        </div>

        <label>
          Estado físico observado
          <textarea
            rows={3}
            placeholder="Ej. equipo operativo, sin daños visibles."
            value={estadoFisico}
            onChange={(e) => setEstadoFisico(e.target.value)}
          />
        </label>

        <button type="submit">{registrado ? 'Devolución registrada ✓' : 'Registrar devolución'}</button>
      </form>
    </div>
  )
}

export default RegistrarDevolucion