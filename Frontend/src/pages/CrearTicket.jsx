import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import './CrearTicket.css'

const subcategorias = {
  Hardware: ['Computadora', 'Monitor', 'Impresora', 'Periféricos', 'Red / Conectividad'],
  Software: ['Aplicación corporativa', 'Correo electrónico', 'Accesos y credenciales', 'Sistema operativo', 'Otro'],
}
const metodosContacto = ['Correo corporativo', 'Teléfono', 'Microsoft Teams']
const prioridades = ['Baja', 'Media', 'Alta']
const MAX_DESCRIPCION = 500

function CrearTicket() {
  const { usuario, rol } = useOutletContext()
  const navigate = useNavigate()

  const [categoria, setCategoria] = useState('Hardware')
  const [subcategoria, setSubcategoria] = useState(subcategorias.Hardware[0])
  const [metodo, setMetodo] = useState(metodosContacto[0])
  const [prioridad, setPrioridad] = useState('Media')
  const [asunto, setAsunto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [imagen, setImagen] = useState(null)
  const [enviado, setEnviado] = useState(false)
  const [idTicket, setIdTicket] = useState(null)

  function elegirCategoria(c) {
    setCategoria(c)
    setSubcategoria(subcategorias[c][0])
  }

  function limpiar() {
    elegirCategoria('Hardware')
    setMetodo(metodosContacto[0])
    setPrioridad('Media')
    setAsunto('')
    setDescripcion('')
    setImagen(null)
  }

  function handleImagen(e) {
    const file = e.target.files?.[0]
    if (file) setImagen(file.name)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!asunto.trim() || !descripcion.trim()) return
    // Mientras no hay backend, simulamos la creación del ticket.
    // Más adelante esto será un POST a /api/tickets con axios (multipart si hay imagen).
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
            <div className="ct-campo">
              <span className="ct-label">Categoría</span>
              <div className="ct-toggle">
                {['Hardware', 'Software'].map((c) => (
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

          <div className="ct-campo">
            <span className="ct-label">Imagen o captura de pantalla <em>(opcional)</em></span>
            <label className="ct-dropzone">
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImagen} hidden />
              <span className="ct-dropzone-icono">↑</span>
              {imagen ? (
                <strong>{imagen}</strong>
              ) : (
                <>
                  <strong>Sube una imagen o arrástrala aquí</strong>
                  <small>PNG, JPG o WEBP</small>
                </>
              )}
            </label>
          </div>

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