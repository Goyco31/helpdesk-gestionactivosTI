import { useState } from 'react'
import './GestionarTicket.css'

// Datos de prueba — cuando exista el backend, esto será
// un GET/PATCH a /api/tickets con axios.
const ticketsIniciales = [
  {
    id: 'TCK-0231',
    colaborador: 'Jose Fernandez',
    categoria: 'Equipos',
    estado: 'En proceso',
    comentario: 'Se reemplazó el cargador; equipo verificado y operativo.',
  },
]

const estados = ['Abierto', 'En proceso', 'Resuelto']

function GestionarTicket() {
  const [tickets, setTickets] = useState(ticketsIniciales)
  const [filtro, setFiltro] = useState('En proceso')
  const [seleccionadoId, setSeleccionadoId] = useState(ticketsIniciales[0].id)
  const [comentario, setComentario] = useState(ticketsIniciales[0].comentario)
  const [guardado, setGuardado] = useState(false)

  const conteos = estados.reduce((acc, e) => {
    acc[e] = tickets.filter((t) => t.estado === e).length
    return acc
  }, {})

  const ticketsFiltrados = tickets.filter((t) => t.estado === filtro)
  const ticketSeleccionado = tickets.find((t) => t.id === seleccionadoId)

  function cambiarEstado(id, nuevoEstado) {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, estado: nuevoEstado } : t)))
  }

  function seleccionar(t) {
    setSeleccionadoId(t.id)
    setComentario(t.comentario)
    setGuardado(false)
  }

  function guardarComentario(e) {
    e.preventDefault()
    setTickets((prev) => prev.map((t) => (t.id === seleccionadoId ? { ...t, comentario } : t)))
    setGuardado(true)
  }

  return (
    <div className="gt-wrap">
      <div className="gt-header">
        <div>
          <h1>Gestión de tickets — Mesa de ayuda</h1>
          <p><strong>RF10</strong> — Actualiza el estado y registra comentarios de resolución.</p>
        </div>
        <div className="gt-filtros">
          {estados.map((e) => (
            <button
              key={e}
              className={`gt-filtro${filtro === e ? ' active' : ''}`}
              onClick={() => setFiltro(e)}
            >
              {e} ({conteos[e]})
            </button>
          ))}
        </div>
      </div>

      <div className="gt-card">
        <table className="gt-table">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Colaborador</th>
              <th>Categoría</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {ticketsFiltrados.map((t) => (
              <tr
                key={t.id}
                className={t.id === seleccionadoId ? 'gt-row-activa' : ''}
                onClick={() => seleccionar(t)}
              >
                <td className="gt-id">{t.id}</td>
                <td>{t.colaborador}</td>
                <td><span className="gt-tag">{t.categoria}</span></td>
                <td><span className={`gt-badge estado-${t.estado.replace(' ', '-').toLowerCase()}`}>{t.estado}</span></td>
                <td onClick={(e) => e.stopPropagation()}>
                  <select value={t.estado} onChange={(e) => cambiarEstado(t.id, e.target.value)}>
                    {estados.map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {ticketsFiltrados.length === 0 && (
              <tr><td colSpan={5} className="gt-vacio">No hay tickets en este estado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {ticketSeleccionado && (
        <form className="gt-comentario-card" onSubmit={guardarComentario}>
          <h4>Comentario de resolución</h4>
          <textarea
            rows={3}
            value={comentario}
            onChange={(e) => { setComentario(e.target.value); setGuardado(false) }}
            placeholder="Describe lo realizado para resolver el ticket..."
          />
          <button type="submit">{guardado ? 'Comentario guardado ✓' : 'Guardar comentario'}</button>
        </form>
      )}
    </div>
  )
}

export default GestionarTicket