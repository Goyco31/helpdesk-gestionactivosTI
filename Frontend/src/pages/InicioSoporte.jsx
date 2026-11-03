import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import api, { contar } from '../api/cliente'
import DashboardInicio from './DashboardInicio'

const accesos = [
  { titulo: 'Gestionar tickets', desc: 'Atiende solicitudes, actualiza estados y registra la solución.', ruta: 'gestionar-ticket', icono: '▤', color: 'rojo' },
  { titulo: 'Asignar activo', desc: 'Vincula un equipo disponible con un colaborador y su ticket.', ruta: 'asignar-activo', icono: '→', color: 'azul' },
  { titulo: 'Registrar devolución', desc: 'Recibe un activo y actualiza su estado en el inventario.', ruta: 'registrar-devolucion', icono: '↩', color: 'ambar' },
  { titulo: 'Generar acta', desc: 'Prepara documentos digitales de entrega o devolución.', ruta: 'generar-acta', icono: '▦', color: 'morado' },
  { titulo: 'Registrar activo', desc: 'Incorpora un nuevo equipo al inventario tecnológico.', ruta: 'registrar-activo', icono: '+', color: 'verde' },
  { titulo: 'Consultar inventario', desc: 'Busca activos y revisa su disponibilidad o ubicación.', ruta: 'consultar-inventario', icono: '◻', color: 'gris' },
]

function InicioSoporte() {
  const { usuario, rol } = useOutletContext()
  const [tickets, setTickets] = useState(null)
  const [activos, setActivos] = useState(null)

  useEffect(() => {
    api.get('/api/tickets').then((r) => setTickets(r.data)).catch(() => setTickets(null))
    api.get('/api/activos').then((r) => setActivos(r.data)).catch(() => setActivos(null))
  }, [])

  const stats = [
    { valor: contar(tickets, (t) => t.estado === 'Abierto' || t.estado === 'En Proceso'), label: 'Tickets pendientes', sub: 'Abiertos o en proceso' },
    { valor: contar(activos, (a) => a.estado === 'por asignar'), label: 'Activos disponibles', sub: 'Listos para asignar' },
    { valor: contar(activos, (a) => a.estado === 'en uso' || a.estado === 'en préstamo'), label: 'Activos asignados', sub: 'En uso o en préstamo' },
    { valor: contar(activos, (a) => a.estado === 'en mantenimiento'), label: 'En mantenimiento', sub: 'Requieren seguimiento' },
  ]

  const primerNombre = usuario
    .split('@')[0]
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .split(' ')[0]

  return (
    <DashboardInicio
      tema="soporte"
      eyebrow="Mesa de ayuda · Soporte TI"
      titulo={`Hola, ${primerNombre}`}
      texto="Atiende los tickets, gestiona los movimientos de activos y genera las actas desde tu panel."
      boton={{ texto: 'Ver tickets', ruta: 'gestionar-ticket' }}
      stats={stats}
      accesos={accesos}
      base="/soporte"
      usuario={usuario}
      rol={rol}
    />
  )
}

export default InicioSoporte
