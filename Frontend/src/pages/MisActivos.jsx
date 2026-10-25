import { useEffect, useState } from 'react'
import api, { claseEstadoActivo, formatoFecha, mensajeError } from '../api/cliente'
import './ConsultarInventario.css'

/** RF03: el colaborador consulta en modo solo lectura los equipos que tiene asignados. */
function MisActivos() {
  const [activos, setActivos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get('/api/activos/mis-activos')
      .then((res) => setActivos(res.data))
      .catch((err) => setError(mensajeError(err, 'No se pudieron cargar tus activos.')))
      .finally(() => setCargando(false))
  }, [])

  return (
    <div className="ci-wrap">
      <h1>Mis activos asignados</h1>
      <p className="ci-subtitle">
        <strong>RF03</strong> — Equipos que tienes a tu cargo. Si alguno falla o ya no lo necesitas, crea un ticket.
      </p>

      <div className="ci-card">
        <table className="ci-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Categoría</th>
              <th>Marca / Modelo</th>
              <th>N.° de serie</th>
              <th>Sede</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {activos.map((a) => (
              <tr key={a.id}>
                <td className="ci-codigo">{a.codigoPatrimonial}</td>
                <td><span className="ci-tag">{a.categoria}</span></td>
                <td>{[a.marca, a.modelo].filter(Boolean).join(' ') || '—'}</td>
                <td>{a.numeroSerie || '—'}</td>
                <td>{a.sede || '—'}</td>
                <td><span className={`ci-badge estado-${claseEstadoActivo(a.estado)}`}>{a.estado}</span></td>
              </tr>
            ))}
            {!cargando && !error && activos.length === 0 && (
              <tr><td colSpan={6} className="ci-vacio">No tienes equipos asignados.</td></tr>
            )}
            {cargando && <tr><td colSpan={6} className="ci-vacio">Cargando...</td></tr>}
            {error && <tr><td colSpan={6} className="ci-vacio">{error}</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="ci-subtitle" style={{ marginTop: 12 }}>Actualizado: {formatoFecha(new Date().toISOString(), true)}</p>
    </div>
  )
}

export default MisActivos
