import { useState } from 'react'
import axios from 'axios'
import './RegistrarUsuario.css'

function RegistrarUsuario() {
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    password: '',
    dni: '',
    cargo: '',
    celular: '',
    area: 'Lima Central' // Valor por defecto para el área/sede
  })
  const [creado, setCreado] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formData.nombre.trim() || !formData.correo.trim()) return

    setLoading(true)
    try {
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/auth/register`
      
      // Enviamos el objeto que coincide exactamente con RegisterRequest del backend
      await axios.post(url, formData)

      setCreado(true)
      
      // Limpiar formulario tras éxito
      setFormData({
        nombre: '',
        correo: '',
        password: '',
        dni: '',
        cargo: '',
        celular: '',
        area: 'Lima Central'
      })

      setTimeout(() => setCreado(false), 3000)
    } catch (error) {
      console.error("Error al registrar el usuario:", error)
      alert("Hubo un error al registrar el usuario en el servidor. Verifica los datos o si el correo ya existe.")
    } finally {
      setLoading(false)
    }
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
              name="nombre"
              placeholder="Ej. Laura Martínez"
              value={formData.nombre}
              onChange={handleChange}
              required
            />
          </label>

          <div className="ru-row">
            <label>
              Correo corporativo
              <input
                type="email"
                name="correo"
                placeholder="usuario@terpel.com"
                value={formData.correo}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Documento (DNI)
              <input
                type="text"
                name="dni"
                placeholder="Número de documento"
                value={formData.dni}
                onChange={handleChange}
                required
              />
            </label>
          </div>

          <div className="ru-row">
            <label>
              Contraseña temporal
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Celular
              <input
                type="text"
                name="celular"
                placeholder="Número de celular"
                value={formData.celular}
                onChange={handleChange}
                required
              />
            </label>
          </div>

          <div className="ru-row">
            <label>
              Área / Sede
              <select name="area" value={formData.area} onChange={handleChange}>
                <option value="Lima Central">Oficna San Isidro</option>
                <option value="Callao">Planta Callao</option>
              </select>
            </label>
            <label>
              Cargo
              <input
                type="text"
                name="cargo"
                placeholder="Ej. Analista de Soporte"
                value={formData.cargo}
                onChange={handleChange}
                required
              />
            </label>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : creado ? 'Usuario creado ✓' : 'Crear usuario'}
          </button>
        </form>

        <aside className="ru-info">
          <div className="ru-info-eyebrow">Acceso seguro</div>
          <h4>Activación de cuenta</h4>
          <p>
            El nuevo usuario recibirá sus credenciales corporativas
            y validará su cuenta en el sistema.
          </p>
          <div className="ru-info-divider" />
          <p className="ru-info-point">La contraseña temporal se asigna de forma segura.</p>
          <p className="ru-info-point">Los permisos dependen del cargo y rol asignado.</p>
          <p className="ru-info-point">Todos los cambios quedan registrados.</p>
        </aside>
      </div>
    </div>
  )
}

export default RegistrarUsuario