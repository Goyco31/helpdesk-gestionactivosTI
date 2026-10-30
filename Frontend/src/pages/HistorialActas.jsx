import { useEffect, useState } from 'react'
import api, { descargarActa, formatoFecha, mensajeError } from '../api/cliente'
import './HistorialActas.css'

const tipos = [
  { valor: 'Todos', texto: 'Todos' },
  { valor: 'Entrega', texto: 'Entrega' },
  { valor: 'Devolucion', texto: 'Devolución' },
  { valor: 'Prestamo', texto: 'Préstamo' },
]
const textoTipo = { Entrega: 'Entrega', Devolucion: 'Devolución', Prestamo: 'Préstamo' }
const claseTipo = { Entrega: 'tipo-asignación', Prestamo: 'tipo-asignación', Devolucion: 'tipo-devolución' }
const textoEstado = { pendiente_firma: 'Pendiente de firma', firmada: 'Firmada', anulada: 'Anulada' }

function HistorialActas() {
  const [actas, setActas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [filtro, setFiltro] = useState('Todos')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    // RF09: actas guardadas en PostgreSQL, la mas reciente primero
    api.get('/api/actas')
      .then((res) => setActas(res.data))
      .catch((err) => setError(mensajeError(err, 'No se pudo cargar el historial de actas.')))
      .finally(() => setCargando(false))
  }, [])

  const texto = busqueda.toLowerCase()
  const filtrado = actas
    .filter((a) => filtro === 'Todos' || a.tipo === filtro)
    .filter((a) =>
      a.colaborador.toLowerCase().includes(texto) ||
      a.codigo.toLowerCase().includes(texto) ||
      String(a.ticketId).includes(texto) ||
      a.equipos.some((e) => e.codigoPatrimonial.toLowerCase().includes(texto) ||
        `${e.marca || ''} ${e.modelo || ''}`.toLowerCase().includes(texto))
    )

  async function abrir(id, descargar) {
    try {
      await descargarActa(id, !descargar)
    } catch (err) {
      alert(mensajeError(err, 'No se pudo obtener el PDF del acta.'))
    }
  }

  return (
    <div className="ha-wrap">
      <h1>Consultar historial de actas</h1>
      <p className="ha-subtitle"><strong>RF09</strong> — Trazabilidad de movimientos por activo o colaborador.</p>

      <div className="ha-toolbar">
        <div className="ha-filtros">
          {tipos.map((t) => (
            <button
              key={t.valor}
              className={`ha-filtro${filtro === t.valor ? ' active' : ''}`}
              onClick={() => setFiltro(t.valor)}
            >
              {t.texto}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Buscar por activo, colaborador, ticket o acta..."
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
              <th>Ticket</th>
              <th>Fecha</th>
              <th>Firma</th>
              <th>PDF</th>
            </tr>
          </thead>
          <tbody>
            {filtrado.map((a) => {
              const eq = a.equipos[0]
              return (
                <tr key={a.id}>
                  <td className="ha-acta">{a.codigo}</td>
                  <td><span className={`ha-badge ${claseTipo[a.tipo] || ''}`}>{textoTipo[a.tipo] || a.tipo}</span></td>
                  <td>{eq ? `${[eq.marca, eq.modelo].filter(Boolean).join(' ')} · ${eq.codigoPatrimonial}` : '—'}</td>
                  <td>{a.colaborador}</td>
                  <td>#{a.ticketId}</td>
                  <td className="ha-fecha">{formatoFecha(a.fechaGeneracion, true)}</td>
                  <td>{textoEstado[a.estado] || a.estado}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="ha-filtro" onClick={() => abrir(a.id, false)} title="Ver en el navegador">Ver</button>{' '}
                    <button className="ha-filtro" onClick={() => abrir(a.id, true)} title={a.archivo || ''}>↓</button>
                  </td>
                </tr>
              )
            })}
            {!cargando && !error && filtrado.length === 0 && (
              <tr><td colSpan={8} className="ha-vacio">No se encontraron actas.</td></tr>
            )}
            {cargando && <tr><td colSpan={8} className="ha-vacio">Cargando...</td></tr>}
            {error && <tr><td colSpan={8} className="ha-vacio">{error}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default HistorialActas
