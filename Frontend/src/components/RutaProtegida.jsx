import { Navigate } from 'react-router-dom'
import { inicioPorRol, sesion } from '../api/cliente'

/**
 * Protege una sección del portal:
 *  - sin sesión (sin token) -> vuelve al login
 *  - con un rol que no corresponde -> va a la pantalla inicial de su rol
 * El backend valida igual cada petición; esto evita mostrar pantallas que
 * luego fallarían con 403.
 */
function RutaProtegida({ roles, children }) {
  const { token, rol } = sesion()
  if (!token) return <Navigate to="/" replace />
  if (roles && !roles.includes(rol)) return <Navigate to={inicioPorRol(rol)} replace />
  return children
}

export default RutaProtegida
