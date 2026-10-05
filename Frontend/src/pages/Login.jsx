import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './Login.css'

function Login() {
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [recordarme, setRecordarme] = useState(false)
  
  // Estados para el 2FA
  const [mostrarModal2FA, setMostrarModal2FA] = useState(false)
  const [codigo2FA, setCodigo2FA] = useState('')
  
  const navigate = useNavigate()

  // Primer paso: Validar credenciales y disparar el correo 2FA
  async function handleLogin(e) {
    e.preventDefault()
    try {
      const url = `${import.meta.env.VITE_API_URL}/api/auth/login`
      await axios.post(url, {
        correo: usuario,
        password: password
      })
      
      // Si las credenciales son correctas, mostramos el modal del 2FA
      setMostrarModal2FA(true)
      
    } catch (error) {
      console.error("Error al iniciar sesión:", error)
      alert("Credenciales incorrectas. Verifica tu usuario y contraseña.")
    }
  }

  // Segundo paso: Validar código 2FA, recibir el token y redirigir según el rol
  async function handleVerify2FA(e) {
    e.preventDefault()
    console.log("1. Enviando código 2FA al backend...");
    
    try {
      const url = `${import.meta.env.VITE_API_URL}/api/auth/verify-2fa`
      console.log("URL llamada:", url);

      const response = await axios.post(url, {
        correo: usuario,
        codigo: codigo2FA 
      })

      console.log("2. ¡Respuesta recibida del backend!", response.data);

      const rolDelUsuario = response.data.role || 'Usuario Final'
      const nombreUsuario = response.data.username || usuario
      const tokenJWT = response.data.token

      console.log("Rol detectado:", rolDelUsuario);
      console.log("Usuario detectado:", nombreUsuario);

      localStorage.setItem('token', tokenJWT)

      if (rolDelUsuario === 'Usuario Final') {
        console.log("Redirigiendo a /usuario/mis-solicitudes...");
        navigate('/usuario/mis-solicitudes', { state: { usuario: nombreUsuario, rol: rolDelUsuario } })
      } else {
        console.log("Redirigiendo a /dashboard...");
        navigate('/dashboard', { state: { usuario: nombreUsuario, rol: rolDelUsuario } })
      }

    } catch (error) {
      console.error("❌ Error atrapado en el catch del 2FA:", error)
      alert("El código ingresado es incorrecto o ha expirado.")
      }
    } 
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">TI</div>

        <h1 className="login-title">Activos de TI · Terpel</h1>
        <p className="login-subtitle">Ingresa con tu credencial corporativa</p>

        <form className="login-form" onSubmit={handleLogin}>
          <label>
            Usuario corporativo
            <input
              type="email"
              placeholder="j.fernandez@terpel.com"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
              disabled={mostrarModal2FA}
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
              disabled={mostrarModal2FA}
            />
          </label>

          <div className="login-row">
            <label className="login-checkbox">
              <input
                type="checkbox"
                checked={recordarme}
                onChange={(e) => setRecordarme(e.target.checked)}
                disabled={mostrarModal2FA}
              />
              recordarme
            </label>
            <a href="#" className="login-link">¿Olvidaste tu contraseña?</a>
          </div>

          <button type="submit" disabled={mostrarModal2FA}>Ingresar al sistema</button>
        </form>

        <p className="login-footer">
          El rol (Administrador, Soporte o Usuario final) se asigna
          automáticamente según tu credencial.
        </p>
      </div>

      {/* Modal 2FA */}
      {mostrarModal2FA && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2>Verificación de seguridad</h2>
            <p>Ingresa el código de 6 dígitos que enviamos a tu aplicación de autenticación.</p>
            
            <form onSubmit={handleVerify2FA} className="modal-form">
              <input
                type="text"
                placeholder="000000"
                maxLength={6}
                value={codigo2FA}
                onChange={(e) => setCodigo2FA(e.target.value.replace(/\D/g, ''))} // Solo permite números
                required
                autoFocus
              />
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-cancel" 
                  onClick={() => setMostrarModal2FA(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-verify">Verificar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Login