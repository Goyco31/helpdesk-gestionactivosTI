import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'

// Mientras no haya backend, simulamos qué rol le corresponde
// a partir del correo ingresado. Cuando el backend exista,
// esta función se reemplaza por la respuesta real del login.
function determinarRolDePrueba(correo) {
  const valor = correo.toLowerCase()
  if (valor.includes('admin')) return 'Administrador'
  if (valor.includes('soporte')) return 'Soporte TI'
  return 'Usuario Final'
}

function Login() {
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [recordarme, setRecordarme] = useState(false)
  const navigate = useNavigate()

  function handleSubmit(e) {
    e.preventDefault()
    const rol = determinarRolDePrueba(usuario)
    if (rol === 'Usuario Final') {
      navigate('/usuario/mis-solicitudes', { state: { usuario, rol } })
    } else {
      navigate('/dashboard', { state: { usuario, rol } })
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">TI</div>

        <h1 className="login-title">Activos de TI · Terpel</h1>
        <p className="login-subtitle">Ingresa con tu credencial corporativa</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Usuario corporativo
            <input
              type="email"
              placeholder="j.fernandez@terpel.com"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              placeholder="••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <div className="login-row">
            <label className="login-checkbox">
              <input
                type="checkbox"
                checked={recordarme}
                onChange={(e) => setRecordarme(e.target.checked)}
              />
              recordarme
            </label>
            <a href="#" className="login-link">¿Olvidaste tu contraseña?</a>
          </div>

          <button type="submit">Ingresar al sistema</button>
        </form>

        <p className="login-footer">
          El rol (Administrador, Soporte o Usuario final) se asigna
          automáticamente según tu credencial.
        </p>
      </div>
    </div>
  )
}

export default Login