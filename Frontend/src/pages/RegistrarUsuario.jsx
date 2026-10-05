import { useState } from 'react'
import './RegistrarUsuario.css'

const sedes = ['Lima Central', 'Callao', 'Arequipa', 'Trujillo']
const roles = ['Usuario', 'Soporte', 'Administrador']

function RegistrarUsuario() {
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [documento, setDocumento] = useState('')
  const [sede, setSede] = useState(sedes[0])
  const [rolInicial, setRolInicial] = useState(roles[0])
  const [creado, setCreado] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (!nombre.trim() || !correo.trim()) return
    // Mientras no hay backend, simulamos la creación del usuario.
    // Más adelante esto será un POST a /api/usuarios con axios.
    setCreado(true)
    setTimeout(() => setCreado(false), 2500)
  }

  return (
    <div className="ru-wrap">
      <div className="ru-eyebrow">Administración</div>
      <h1>Registrar usuario</h1>
      <p className="ru-subtitle">Crea una cuenta corporativa y asigna su acceso inicial al sistema.</p>

      <div className="ru-layout">
        <form className="ru-form-card" onSubmit={handleSubmit}>
          <label>
            Nombre completo
            <input
              type="text"
              placeholder="Ej. Laura Martínez"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </label>

          <div className="ru-row">
            <label>
              Correo corporativo
              <input
                type="email"
                placeholder="usuario@terpel.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
              />
            </label>
            <label>
              Documento
              <input
                type="text"
                placeholder="Número de documento"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
              />
            </label>
          </div>

          <div className="ru-row">
            <label>
              Sede
              <select value={sede} onChange={(e) => setSede(e.target.value)}>
                {sedes.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label>
              Rol inicial
              <select value={rolInicial} onChange={(e) => setRolInicial(e.target.value)}>
                {roles.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
          </div>

          <button type="submit">{creado ? 'Usuario creado ✓' : 'Crear usuario'}</button>
        </form>

        <aside className="ru-info">
          <div className="ru-info-eyebrow">Acceso seguro</div>
          <h4>Activación de cuenta</h4>
          <p>
            El nuevo usuario recibirá un correo para establecer su contraseña
            y validar la cuenta corporativa.
          </p>
          <div className="ru-info-divider" />
          <p className="ru-info-point">La contraseña no es visible para el administrador.</p>
          <p className="ru-info-point">Los permisos dependen del rol seleccionado.</p>
          <p className="ru-info-point">Todos los cambios quedan registrados.</p>
        </aside>
      </div>
    </div>
  )
}

export default RegistrarUsuario