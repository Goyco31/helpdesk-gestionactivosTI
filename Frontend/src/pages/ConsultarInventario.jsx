import { useEffect, useState } from 'react'
import api, { claseEstadoActivo, mensajeError } from '../api/cliente'
import './ConsultarInventario.css'

const filtros = ['Todos', 'por asignar', 'en uso', 'en préstamo', 'en mantenimiento', 'para donar', 'para baja']

function ConsultarInventario() {
  const [filtro, setFiltro] = useState('Todos')
  const [inventario, setInventario] = useState([])
  const [incluirBaja, setIncluirBaja] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // RF04: inventario en tiempo real desde PostgreSQL (los "de baja" se ocultan por defecto)
    api.get('/api/activos', { params: { incluirBaja } })
      .then((res) => { setInventario(res.data); setError(null) })
      .catch((err) => setError(mensajeError(err, 'No se pudo cargar el inventario.')))
      .finally(() => setCargando(false))
  }, [incluirBaja])

  const opciones = incluirBaja ? [...filtros, 'de baja'] : filtros
  const filtrados = filtro === 'Todos' ? inventario : inventario.filter((a) => a.estado === filtro)

  return (
    <div className="ci-wrap">
      <h1>Consultar inventario</h1>
      <p className="ci-subtitle"><strong>RF04</strong> — Disponibilidad en tiempo real del inventario tecnológico.</p>

      <div className="ci-filtros">
        {opciones.map((f) => (
          <button
            key={f}
            className={`ci-filtro${filtro === f ? ' active' : ''}`}
            onClick={() => setFiltro(f)}
          >
            {f === 'Todos' ? f : f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'Todos' && <span className="ci-count">{inventario.length}</span>}
          </button>
        ))}
        <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <input
            type="checkbox"
            checked={incluirBaja}
            onChange={(e) => { setIncluirBaja(e.target.checked); setFiltro('Todos') }}
          />
          Mostrar dados de baja
        </label>
      </div>

      <div className="ci-card">
        <table className="ci-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Categoría</th>
              <th>Marca / Modelo</th>
              <th>Sede</th>
              <th>Asignado a</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((a) => (
              <tr key={a.id}>
                <td className="ci-codigo">{a.codigoPatrimonial}</td>
                <td><span className="ci-tag">{a.categoria}</span></td>
                <td>{[a.marca, a.modelo].filter(Boolean).join(' ') || '—'}</td>
                <td>{a.sede || '—'}</td>
                <td>{a.usuarioActual || '—'}</td>
                <td><span className={`ci-badge estado-${claseEstadoActivo(a.estado)}`}>{a.estado}</span></td>
              </tr>
            ))}
            {!cargando && !error && filtrados.length === 0 && (
              <tr><td colSpan={6} className="ci-vacio">No hay activos en este estado.</td></tr>
            )}
            {cargando && <tr><td colSpan={6} className="ci-vacio">Cargando...</td></tr>}
            {error && <tr><td colSpan={6} className="ci-vacio">{error}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ConsultarInventario
