import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import api, { mensajeError } from '../api/cliente'
import { armarDescripcion } from './ticketUtils'
import './CrearTicket.css'

// Categorías del sistema (las mismas que usan los reportes y el SLA)
const subcategorias = {
  Equipos: ['Computadora', 'Monitor', 'Impresora', 'Periféricos', 'Otro'],
  Aplicaciones: ['Aplicación corporativa', 'Correo electrónico', 'Accesos y credenciales', 'Sistema operativo', 'Otro'],
  Redes: ['Conectividad', 'Wifi de sede', 'VPN', 'Telefonía', 'Otro'],
}
const categorias = Object.keys(subcategorias)
const metodosContacto = ['Correo corporativo', 'Teléfono', 'Microsoft Teams']
const prioridades = ['Baja', 'Media', 'Alta']
const MAX_TOTAL = 500 // columna descripcion de la tabla ticket

function CrearTicket() {
  const { usuario, rol } = useOutletContext()
  const navigate = useNavigate()

  const [categoria, setCategoria] = useState(categorias[0])
  const [subcategoria, setSubcategoria] = useState(subcategorias[categorias[0]][0])
  const [metodo, setMetodo] = useState(metodosContacto[0])
  const [prioridad, setPrioridad] = useState('Media')
  const [asunto, setAsunto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [idTicket, setIdTicket] = useState(null)
  const [enviando, setEnviando] = useState(false)

  // La subcategoría y el contacto viajan al inicio de la descripción, así que restan espacio
  const maxDescripcion = MAX_TOTAL - armarDescripcion(subcategoria, metodo, '').length

  function elegirCategoria(c) {
    setCategoria(c)
    setSubcategoria(subcategorias[c][0])
  }

  function limpiar() {
    elegirCategoria(categorias[0])
    setMetodo(metodosContacto[0])
    setPrioridad('Media')
    setAsunto('')
    setDescripcion('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!asunto.trim() || !descripcion.trim()) return
    setEnviando(true)
    try {
      // RF02: se registra en PostgreSQL con estado "Abierto"
      const { data } = await api.post('/api/tickets', {
        asunto,
        categoria,
        prioridad,
        descripcion: armarDescripcion(subcategoria, metodo, descripcion.slice(0, maxDescripcion)),
      })
      setIdTicket(data.id)
      setEnviado(true)
    } catch (error) {
      console.error('Error al crear el ticket:', error)
      alert(mensajeError(error, 'No se pudo crear el ticket.'))
    } finally {
      setEnviando(false)
    }
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
            <div className="ct-campo">
              <span className="ct-label">Categoría</span>
              <div className="ct-toggle">
                {categorias.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={categoria === c ? 'active' : ''}
                    onClick={() => elegirCategoria(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <label>
              Subcategoría
              <select value={subcategoria} onChange={(e) => setSubcategoria(e.target.value)}>
                {subcategorias[categoria].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>

          <div className="ct-row">
            <label>
              Método de contacto
              <select value={metodo} onChange={(e) => setMetodo(e.target.value)}>
                {metodosContacto.map((m) => <option key={m} value={m}>{m}</option>)}
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
              maxLength={200}
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
              maxLength={maxDescripcion}
              placeholder="Describe el problema, cuándo comenzó y cualquier mensaje de error que hayas visto."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              required
            />
            <div className="ct-counter">{Math.min(descripcion.length, maxDescripcion)}/{maxDescripcion}</div>
          </label>

          <div className="ct-divider" />

          <div className="ct-actions">
            <button type="button" className="ct-limpiar" onClick={limpiar}>Limpiar</button>
            <button type="submit" className="ct-enviar" disabled={enviando}>
              {enviando ? 'Enviando...' : 'Enviar ticket'}
            </button>
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
