import { useState } from 'react'
import './ConsultarInventario.css'

const inventario = [
  { codigo: 'TP-CP-00089', categoria: 'CPU', marca: 'HP EliteDesk 800', sede: 'Lima Central', estado: 'Asignado' },
  { codigo: 'TP-LT-00231', categoria: 'Laptop', marca: 'Dell Latitude 5440', sede: 'Lima Central', estado: 'Disponible' },
  { codigo: 'TP-MN-00120', categoria: 'Monitor', marca: 'LG 24ML600', sede: 'Callao', estado: 'Mantenimiento' },
  { codigo: 'TP-IM-00034', categoria: 'Impresora', marca: 'Epson L3250', sede: 'Arequipa', estado: 'Disponible' },
  { codigo: 'TP-RT-00018', categoria: 'Router', marca: 'TP-Link AX3000', sede: 'Callao', estado: 'Asignado' },
]

const filtros = ['Todos', 'Disponible', 'Asignado', 'Mantenimiento', 'Baja']

function ConsultarInventario() {
  const [filtro, setFiltro] = useState('Todos')

  const filtrados = filtro === 'Todos' ? inventario : inventario.filter((a) => a.estado === filtro)

  return (
    <div className="ci-wrap">
      <h1>Consultar inventario</h1>
      <p className="ci-subtitle"><strong>RF04</strong> — Disponibilidad en tiempo real del inventario tecnológico.</p>

      <div className="ci-filtros">
        {filtros.map((f) => (
          <button
            key={f}
            className={`ci-filtro${filtro === f ? ' active' : ''}`}
            onClick={() => setFiltro(f)}
          >
            {f}
            {f === 'Todos' && <span className="ci-count">{inventario.length}</span>}
          </button>
        ))}
      </div>

      <div className="ci-card">
        <table className="ci-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Categoría</th>
              <th>Marca / Modelo</th>
              <th>Sede</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((a) => (
              <tr key={a.codigo}>
                <td className="ci-codigo">{a.codigo}</td>
                <td><span className="ci-tag">{a.categoria}</span></td>
                <td>{a.marca}</td>
                <td>{a.sede}</td>
                <td><span className={`ci-badge estado-${a.estado.toLowerCase()}`}>{a.estado}</span></td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr><td colSpan={5} className="ci-vacio">No hay activos en este estado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ConsultarInventario