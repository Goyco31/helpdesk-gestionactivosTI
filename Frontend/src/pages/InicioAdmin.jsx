import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import api, { contar } from '../api/cliente'
import DashboardInicio from './DashboardInicio'

const accesos = [
  { titulo: 'Registrar usuario', desc: 'Crea nuevas cuentas corporativas y asigna su perfil inicial.', ruta: 'registrar-usuario', icono: '+', color: 'rojo' },
  { titulo: 'Roles y permisos', desc: 'Administra los accesos y responsabilidades de cada usuario.', ruta: 'gestionar-roles', icono: '◇', color: 'morado' },
  { titulo: 'Reportes de inventario', desc: 'Consulta indicadores y exporta el estado del inventario.', ruta: 'reportes-inventario', icono: '▥', color: 'azul' },
  { titulo: 'Gestionar tickets', desc: 'Supervisa las solicitudes y el avance del equipo de soporte.', ruta: 'gestionar-ticket', icono: '▤', color: 'ambar' },
  { titulo: 'Consultar inventario', desc: 'Revisa activos, disponibilidad y ubicación actual.', ruta: 'consultar-inventario', icono: '◻', color: 'verde' },
  { titulo: 'Historial de actas', desc: 'Consulta las actas y la trazabilidad de los movimientos.', ruta: 'historial-actas', icono: '⌕', color: 'gris' },
]

function InicioAdmin() {
  const { usuario, rol } = useOutletContext()
  const [usuarios, setUsuarios] = useState(null)
  const [activos, setActivos] = useState(null)
  const [tickets, setTickets] = useState(null)

  useEffect(() => {
    api.get('/api/usuarios').then((r) => setUsuarios(r.data)).catch(() => setUsuarios(null))
    api.get('/api/activos').then((r) => setActivos(r.data)).catch(() => setActivos(null))
    api.get('/api/tickets').then((r) => setTickets(r.data)).catch(() => setTickets(null))
  }, [])

  const stats = [
    { valor: usuarios ? usuarios.length : '—', label: 'Usuarios registrados', sub: 'Cuentas en el sistema' },
    { valor: activos ? activos.length : '—', label: 'Activos registrados', sub: 'Inventario vigente (sin bajas)' },
    { valor: contar(tickets, (t) => t.estado === 'Abierto' || t.estado === 'En Proceso'), label: 'Tickets pendientes', sub: 'Requieren seguimiento' },
    { valor: contar(activos, (a) => a.estado === 'en mantenimiento'), label: 'En mantenimiento', sub: 'Activos no disponibles' },
  ]

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
