import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import './CrearTicket.css'

const categorias = ['Equipos', 'Aplicaciones', 'Redes']
const prioridades = ['Baja', 'Media', 'Alta']
const MAX_DESCRIPCION = 500

function CrearTicket() {
  const { usuario, rol } = useOutletContext()
  const navigate = useNavigate()

  const [categoria, setCategoria] = useState(categorias[0])
  const [prioridad, setPrioridad] = useState('Media')
  const [asunto, setAsunto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [idTicket, setIdTicket] = useState(null)

  function limpiar() {
    setCategoria(categorias[0])
    setPrioridad('Media')
    setAsunto('')
    setDescripcion('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!asunto.trim() || !descripcion.trim()) return
    // Mientras no hay backend, simulamos la creación del ticket.
    // Más adelante esto será un POST a /api/tickets con axios.
    const nuevoId = Math.floor(1000 + Math.random() * 9000)
    setIdTicket(nuevoId)
    setEnviado(true)
  }

  function volverAMisSolicitudes() {
    navigate('/usuario/mis-solicitudes', { state: { usuario, rol } })
  }

  if (enviado) {
    return (
      <div className="ct-wrap">
        <div className="ct-confirm-card">
          <div className="ct-check">✓</div>
          <h1>Ticket creado</h1>
          <p>
            Tu solicitud quedó registrada con el número{' '}
            <strong>#{idTicket}</strong> y estado <strong>Abierto</strong>.
            El área de soporte la revisará pronto.
          </p>
          <button onClick={volverAMisSolicitudes}>Volver a mis solicitudes</button>
        </div>
      </div>
    )
  }

  return (
    <div className="ct-wrap">
      <div className="ct-eyebrow">Mesa de ayuda</div>
      <h1>Crear un nuevo ticket</h1>
      <p className="ct-subtitle">Cuéntanos qué necesitas y el equipo de soporte te ayudará.</p>

      <div className="ct-layout">
        <form className="ct-form-card" onSubmit={handleSubmit}>
          <div className="ct-row">
            <label>
              Categoría
              <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label>
              Prioridad
              <select value={prioridad} onChange={(e) => setPrioridad(e.target.value)}>
                {prioridades.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
          </div>

          <label>
            Asunto
            <input
              type="text"
              placeholder="Ej. No puedo acceder a mi correo"
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              required
            />
          </label>

          <label>
            Descripción
            <textarea
              rows={5}
              maxLength={MAX_DESCRIPCION}
              placeholder="Describe el problema, cuándo comenzó y cualquier mensaje de error que hayas visto."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              required
            />
            <div className="ct-counter">{descripcion.length}/{MAX_DESCRIPCION}</div>
          </label>

          <div className="ct-divider" />

          <div className="ct-actions">
            <button type="button" className="ct-limpiar" onClick={limpiar}>Limpiar</button>
            <button type="submit" className="ct-enviar">Enviar ticket</button>
          </div>
        </form>

        <aside className="ct-tips">
          <div className="ct-tips-icon">?</div>
          <h4>Antes de enviar</h4>
          <ul>
            <li>Incluye el mensaje de error exacto, si existe.</li>
            <li>Indica el equipo o aplicación afectada.</li>
            <li>Evita compartir contraseñas o información sensible.</li>
          </ul>
          <div className="ct-tips-divider" />
          <strong className="ct-horario-titulo">Atención de soporte</strong>
          <p className="ct-horario-texto">Lunes a viernes, 8:00 a 18:00</p>
        </aside>
      </div>
    </div>
  )
}

export default CrearTicket