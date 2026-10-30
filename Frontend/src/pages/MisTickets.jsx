import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import api, { formatoFecha, mensajeError } from '../api/cliente'
import './MisTickets.css'

const estadoClase = {
  'En Proceso': 'estado-proceso',
  'Resuelto': 'estado-resuelto',
  'Cerrado': 'estado-cerrado',
  'Abierto': 'estado-abierto',
}

const filtros = ['Todos', 'Abierto', 'En Proceso', 'Resuelto', 'Cerrado']

function MisTickets() {
  const { usuario, rol } = useOutletContext()
  const navigate = useNavigate()
  const [filtro, setFiltro] = useState('Todos')
  const [tickets, setTickets] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // RF02: el backend devuelve solo los tickets del usuario autenticado
    api.get('/api/tickets')
      .then((res) => setTickets([...res.data].sort((a, b) => b.id - a.id)))
      .catch((err) => setError(mensajeError(err, 'No se pudieron cargar tus tickets.')))
      .finally(() => setCargando(false))
  }, [])

  const ticketsFiltrados = filtro === 'Todos'
    ? tickets
    : tickets.filter((t) => t.estado === filtro)

  return (
    <div className="mt-wrap">
      <div className="mt-header">
        <div>
          <h1>Mis solicitudes de soporte</h1>
          <p>Historial y estado de tus tickets</p>
        </div>
        <button
          className="mt-nuevo"
          onClick={() => navigate('/usuario/crear-ticket', { state: { usuario, rol } })}
        >
          + Nuevo ticket
        </button>
      </div>

      <div className="mt-filtros">
        {filtros.map((f) => (
          <button
            key={f}
            className={`mt-filtro${filtro === f ? ' active' : ''}`}
            onClick={() => setFiltro(f)}
          >
            {f}
            {f === 'Todos' && <span className="mt-count">{tickets.length}</span>}
          </button>
        ))}
      </div>

      <div className="mt-card">
        <table className="mt-table">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Categoría</th>
              <th>Asunto</th>
              <th>Fecha</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {ticketsFiltrados.map((t) => (
              <tr key={t.id}>
                <td className="mt-id">#{t.id}</td>
                <td><span className="mt-tag">{t.categoria}</span></td>
                <td title={t.descripcion || ''}>{t.asunto}</td>
                <td>{formatoFecha(t.fechaCreacion)}</td>
                <td><span className={`mt-badge ${estadoClase[t.estado] || ''}`}>{t.estado}</span></td>
              </tr>
            ))}
            {!cargando && !error && ticketsFiltrados.length === 0 && (
              <tr><td colSpan={5} className="mt-vacio">No tienes tickets en este estado.</td></tr>
            )}
            {cargando && <tr><td colSpan={5} className="mt-vacio">Cargando...</td></tr>}
            {error && <tr><td colSpan={5} className="mt-vacio">{error}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default MisTickets
