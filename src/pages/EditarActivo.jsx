import { useState } from 'react'
import './EditarActivo.css'

const activosIniciales = [
  { codigo: 'TP-CP-00089', categoria: 'CPU', marca: 'HP', modelo: 'EliteDesk 800', estado: 'Asignado' },
  { codigo: 'TP-LT-00231', categoria: 'Laptop', marca: 'Dell', modelo: 'Latitude 5440', estado: 'Disponible' },
  { codigo: 'TP-MN-00120', categoria: 'Monitor', marca: 'LG', modelo: '24ML600', estado: 'Mantenimiento' },
]

function EditarActivo() {
  const [activos, setActivos] = useState(activosIniciales)
  const [seleccionadoId, setSeleccionadoId] = useState(activosIniciales[0].codigo)
  const [marca, setMarca] = useState(activosIniciales[0].marca)
  const [modelo, setModelo] = useState(activosIniciales[0].modelo)
  const [guardado, setGuardado] = useState(false)

  const activo = activos.find((a) => a.codigo === seleccionadoId)

  function seleccionar(codigo) {
    const a = activos.find((x) => x.codigo === codigo)
    setSeleccionadoId(codigo)
    setMarca(a.marca)
    setModelo(a.modelo)
    setGuardado(false)
  }

  function guardarCambios(e) {
    e.preventDefault()
    // Mientras no hay backend, actualizamos localmente.
    // Más adelante esto será un PATCH a /api/activos/:codigo con axios (RF04).
    setActivos((prev) => prev.map((a) => (a.codigo === seleccionadoId ? { ...a, marca, modelo } : a)))
    setGuardado(true)
  }

  function darDeBaja() {
    if (!confirm(`¿Dar de baja el activo ${activo.codigo}? Esta acción no se puede deshacer.`)) return
    setActivos((prev) => prev.map((a) => (a.codigo === seleccionadoId ? { ...a, estado: 'Baja' } : a)))
  }

  return (
    <div className="ea-wrap">
      <h1>Editar / dar de baja activo</h1>
      <p className="ea-subtitle"><strong>RF04</strong> — Actualiza los datos de un activo o retíralo del inventario.</p>

      <div className="ea-layout">
        <form className="ea-card" onSubmit={guardarCambios}>
          <label>
            Activo
            <select value={seleccionadoId} onChange={(e) => seleccionar(e.target.value)}>
              {activos.map((a) => (
                <option key={a.codigo} value={a.codigo}>{a.codigo} — {a.marca} {a.modelo}</option>
              ))}
            </select>
          </label>

          <div className="ea-row">
            <label>
              Marca
              <input type="text" value={marca} onChange={(e) => { setMarca(e.target.value); setGuardado(false) }} />
            </label>
            <label>
              Modelo
              <input type="text" value={modelo} onChange={(e) => { setModelo(e.target.value); setGuardado(false) }} />
            </label>
          </div>

          <div className="ea-estado-actual">
            Estado actual: <span className={`ea-badge estado-${activo.estado.toLowerCase()}`}>{activo.estado}</span>
          </div>

          <button type="submit" className="ea-guardar">{guardado ? 'Cambios guardados ✓' : 'Guardar cambios'}</button>
        </form>

        <div className="ea-peligro">
          <h4>Dar de baja</h4>
          <p>Marca este activo como dado de baja. Dejará de estar disponible para asignación.</p>
          <button
            type="button"
            onClick={darDeBaja}
            disabled={activo.estado === 'Baja'}
          >
            {activo.estado === 'Baja' ? 'Ya está dado de baja' : 'Dar de baja este activo'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditarActivo