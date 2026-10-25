import axios from 'axios'

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

/**
 * Cliente HTTP del sistema. Agrega el token JWT a cada petición y, si el
 * backend responde 401 (sesión vencida o token inválido), vuelve al login.
 */
const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/api/auth/')) {
      localStorage.removeItem('token')
      alert('Tu sesión expiró. Vuelve a iniciar sesión.')
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

/** Mensaje legible de un error del backend (campo "mensaje" del JSON de error). */
export function mensajeError(error, porDefecto = 'Ocurrió un error. Inténtalo nuevamente.') {
  const status = error.response?.status
  if (status === 403) return 'Tu rol no tiene permiso para esta operación.'
  return error.response?.data?.mensaje || porDefecto
}

/** Descarga (o abre en otra pestaña) el PDF de un acta, enviando el token. */
export async function descargarActa(actaId, abrir = false) {
  const res = await api.get(`/api/actas/${actaId}/pdf`, { responseType: 'blob' })
  const url = URL.createObjectURL(res.data)
  if (abrir) {
    window.open(url, '_blank', 'noopener')
  } else {
    const disposicion = res.headers['content-disposition'] || ''
    const match = /filename\*=UTF-8''([^;]+)/i.exec(disposicion) || /filename="?([^";]+)"?/i.exec(disposicion)
    const a = document.createElement('a')
    a.href = url
    a.download = match ? decodeURIComponent(match[1]) : `acta-${actaId}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

/** Nombre del estado del activo -> clase CSS de los badges existentes. */
export function claseEstadoActivo(estado) {
  return {
    'por asignar': 'disponible',
    'en uso': 'asignado',
    'en préstamo': 'asignado',
    'en mantenimiento': 'mantenimiento',
    'para donar': 'baja',
    'para baja': 'baja',
    'de baja': 'baja',
  }[estado] || 'disponible'
}

export function formatoFecha(iso, conHora = false) {
  if (!iso) return '—'
  const d = new Date(iso)
  return conHora
    ? d.toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })
    : d.toLocaleDateString('es-PE')
}

export default api
