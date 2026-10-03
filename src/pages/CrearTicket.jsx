import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './CrearTicket.css'

const categorias = ['Equipos', 'Aplicaciones', 'Redes']

function CrearTicket() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const usuario = state?.usuario || 'usuario@terpel.com'
  const rol = state?.rol || 'Usuario Final'

  const [categoria, setCategoria] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [idTicket, setIdTicket] = useState(null)

  const faltaCategoria = categoria === ''
  const faltaDescripcion = descripcion.trim() === ''

  function handleSubmit(e) {
    e.preventDefault()
    if (faltaCategoria || faltaDescripcion) return
    // Mientras no hay backend, simulamos la creación del ticket.
    // Más adelante esto será un POST a /api/tickets con axios.
    const nuevoId = Math.floor(1000 + Math.random() * 9000)
    setIdTicket(nuevoId)
    setEnviado(true)
  }

  function volverAlDashboard() {
    navigate('/dashboard', { state: { usuario, rol } })
  }

  if (enviado) {
    return (
      <div className="ticket-page">
        <div className="ticket-confirm-card">
          <div className="ticket-check">✓</div>
          <h1>Ticket creado</h1>
          <p>
            Tu solicitud quedó registrada con el número{' '}
            <strong>#{idTicket}</strong> y estado <strong>Abierto</strong>.
            El área de soporte la revisará pronto.
          </p>
          <button onClick={volverAlDashboard}>Volver al inicio</button>
        </div>
      </div>
    )
  }

  return (
    <div className="ticket-page">
      <form className="ticket-container" onSubmit={handleSubmit}>
        <div className="ticket-main">
          <button type="button" className="ticket-volver" onClick={volverAlDashboard}>← Volver</button>

          <div className="ticket-titulo-row">
            <h1>Reportar un problema técnico</h1>
          </div>
          <p className="ticket-lead">
            Usa este formulario para reportar incidencias de equipos, aplicaciones o redes.
          </p>

          <div className="ticket-divider" />

          <div className="ticket-info-box">
            <p>
              Utiliza este formulario para reportar incidentes técnicos relacionados
              con equipos, aplicaciones o redes: errores del sistema, mal
              funcionamiento de aplicativos, fallas de dispositivos o problemas de
              conectividad.
            </p>
            <p>
              Entre más detalle brindes (equipo afectado, mensaje de error, pasos
              realizados), más rápido podrá resolverlo el equipo de soporte.
            </p>
          </div>

          <div className="ticket-field">
            <label>¿Quién reporta el problema? <span className="req">*</span></label>
            <div className="ticket-user-input">
              <span className="ticket-user-avatar">👤</span>
              <input type="text" value={usuario} readOnly />
            </div>
          </div>

          <div className="ticket-field">
            <label>Seleccione una categoría <span className="req">*</span></label>
            <div className="ticket-radio-group">
              {categorias.map((c) => (
                <label key={c} className="ticket-radio">
                  <input
                    type="radio"
                    name="categoria"
                    value={c}
                    checked={categoria === c}
                    onChange={(e) => setCategoria(e.target.value)}
                  />
                  {c}
                </label>
              ))}
            </div>
          </div>

          <div className="ticket-field">
            <label>Describa su problema en detalle <span className="req">*</span></label>
            <textarea
              rows={5}
              placeholder="Por ejemplo: el equipo no enciende, el aplicativo marca error al iniciar sesión, no tengo acceso a la red del piso 3..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>
        </div>

        <aside className="ticket-sidebar">
          <button type="submit" className="ticket-enviar">Enviar</button>
        </aside>
      </form>
    </div>
  )
}

export default CrearTicket