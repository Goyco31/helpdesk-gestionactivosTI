import { useOutletContext } from 'react-router-dom'
import DashboardInicio from './DashboardInicio'

// Datos de prueba — cuando exista el backend, los contadores
// vendrán de un GET a /api/admin/resumen con axios.
const stats = [
  { valor: 4, label: 'Usuarios activos', sub: 'Cuentas habilitadas' },
  { valor: 8, label: 'Activos registrados', sub: 'Inventario tecnológico' },
  { valor: 0, label: 'Tickets pendientes', sub: 'Requieren seguimiento' },
  { valor: 1, label: 'En mantenimiento', sub: 'Activos no disponibles' },
]

const accesos = [
  { titulo: 'Registrar usuario', desc: 'Crea nuevas cuentas corporativas y asigna su perfil inicial.', ruta: 'registrar-usuario', icono: '+', color: 'rojo' },
  { titulo: 'Roles y permisos', desc: 'Administra los accesos y responsabilidades de cada usuario.', ruta: 'gestionar-roles', icono: '◇', color: 'morado' },
  { titulo: 'Reportes de inventario', desc: 'Consulta indicadores y exporta el estado del inventario.', ruta: 'reportes-inventario', icono: '▥', color: 'azul' },
  { titulo: 'Gestionar tickets', desc: 'Supervisa las solicitudes y el avance del equipo de soporte.', ruta: 'gestionar-ticket', icono: '▤', color: 'ambar' },
  { titulo: 'Consultar inventario', desc: 'Revisa activos, disponibilidad y ubicación actual.', ruta: 'consultar-inventario', icono: '◻', color: 'verde' },
  { titulo: 'Trazabilidad', desc: 'Consulta movimientos y antecedentes de los activos.', ruta: 'historial-actas', icono: '⌕', color: 'gris' },
]

function InicioAdmin() {
  const { usuario, rol } = useOutletContext()
  const primerNombre = usuario
    .split('@')[0]
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .split(' ')[0]

  return (
    <DashboardInicio
      tema="admin"
      eyebrow="Administración del sistema"
      titulo={`Hola, ${primerNombre}`}
      texto="Supervisa usuarios, permisos, inventario y solicitudes desde tu panel de administración."
      boton={{ texto: 'Ver reportes', ruta: 'reportes-inventario' }}
      stats={stats}
      accesos={accesos}
      base="/administrador"
      usuario={usuario}
      rol={rol}
    />
  )
}

export default InicioAdmin