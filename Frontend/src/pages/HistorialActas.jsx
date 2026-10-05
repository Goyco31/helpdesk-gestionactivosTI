import { useState } from 'react'
import './HistorialActas.css'

const historial = [
  { acta: 'A-1043', tipo: 'Asignación', activo: 'HP EliteDesk 800 · TP-CP-00089', colaborador: 'Jose Fernandez', fecha: '31/08/2026' },
  { acta: 'A-0988', tipo: 'Devolución', activo: 'Dell Latitude 5440 · TP-LT-00231', colaborador: 'María Torres', fecha: '14/07/2026' },
  { acta: 'A-0901', tipo: 'Asignación', activo: 'LG 24ML600 · TP-MN-00120', colaborador: 'Diego Cosme', fecha: '05/03/2026' },
]

const tipos = ['Todos', 'Asignación', 'Devolución']

function HistorialActas() {
  const [filtro, setFiltro] = useState('Todos')
  const [busqueda, setBusqueda] = useState('')

  const filtrado = historial
    .filter((h) => filtro === 'Todos' || h.tipo === filtro)
    .filter((h) =>
      h.colaborador.toLowerCase().includes(busqueda.toLowerCase()) ||
      h.activo.toLowerCase().includes(busqueda.toLowerCase()) ||
      h.acta.toLowerCase().includes(busqueda.toLowerCase())
    )

  return (
    <div className="ha-wrap">
      <h1>Consultar historial de actas</h1>
      <p className="ha-subtitle"><strong>RF09</strong> — Trazabilidad de movimientos por activo o colaborador.</p>

      <div className="ha-toolbar">
        <div className="ha-filtros">
          {tipos.map((t) => (
            <button
              key={t}
              className={`ha-filtro${filtro === t ? ' active' : ''}`}
              onClick={() => setFiltro(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Buscar por activo, colaborador o acta..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="ha-card">
        <table className="ha-table">
          <thead>
            <tr>
              <th>Acta</th>
              <th>Tipo</th>
              <th>Activo</th>
              <th>Colaborador</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {filtrado.map((h) => (
              <tr key={h.acta}>
                <td className="ha-acta">{h.acta}</td>
                <td><span className={`ha-badge tipo-${h.tipo.toLowerCase()}`}>{h.tipo}</span></td>
                <td>{h.activo}</td>
                <td>{h.colaborador}</td>
                <td className="ha-fecha">{h.fecha}</td>
              </tr>
            ))}
            {filtrado.length === 0 && (
              <tr><td colSpan={5} className="ha-vacio">No se encontraron movimientos.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default HistorialActas