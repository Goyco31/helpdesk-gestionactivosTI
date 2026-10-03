import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import './MisTickets.css'

// Datos de prueba — cuando exista el backend, esto será
// un GET a /api/tickets?usuario=... con axios.
const ticketsDePrueba = [
  { id: 'TCK-0231', categoria: 'Equipos', descripcion: 'Laptop no enciende', estado: 'En proceso' },
  { id: 'TCK-0219', categoria: 'Redes', descripcion: 'Sin acceso a wifi de sede', estado: 'Resuelto' },
  { id: 'TCK-0198', categoria: 'Equipos', descripcion: 'Solicitud de monitor adicional', estado: 'Cerrado' },
  { id: 'TCK-0177', categoria: 'Aplicaciones', descripcion: 'Acceso a ERP comercial', estado: 'Cerrado' },
]

const estadoClase = {
  'En proceso': 'estado-proceso',
  'Resuelto': 'estado-resuelto',
  'Cerrado': 'estado-cerrado',
  'Abierto': 'estado-abierto',
}

const filtros = ['Todos', 'Abierto', 'En proceso', 'Resuelto', 'Cerrado']

function MisTickets() {
  const { usuario, rol } = useOutletContext()
  const navigate = useNavigate()
  const [filtro, setFiltro] = useState('Todos')

  const ticketsFiltrados = filtro === 'Todos'
    ? ticketsDePrueba
    : ticketsDePrueba.filter((t) => t.estado === filtro)

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
            {f === 'Todos' && <span className="mt-count">{ticketsDePrueba.length}</span>}
          </button>
        ))}
      </div>

      <div className="mt-card">
        <table className="mt-table">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Categoría</th>
              <th>Descripción</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {ticketsFiltrados.map((t) => (
              <tr key={t.id}>
                <td className="mt-id">{t.id}</td>
                <td><span className="mt-tag">{t.categoria}</span></td>
                <td>{t.descripcion}</td>
                <td><span className={`mt-badge ${estadoClase[t.estado]}`}>{t.estado}</span></td>
              </tr>
            ))}
            {ticketsFiltrados.length === 0 && (
              <tr><td colSpan={4} className="mt-vacio">No tienes tickets en este estado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default MisTickets