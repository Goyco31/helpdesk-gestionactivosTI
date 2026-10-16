import { useOutletContext } from 'react-router-dom'
import DashboardInicio from './DashboardInicio'

// Datos de prueba — cuando exista el backend, los contadores
// vendrán de un GET a /api/soporte/resumen con axios.
const stats = [
  { valor: 0, label: 'Tickets pendientes', sub: 'Por atender o en proceso' },
  { valor: 2, label: 'Activos disponibles', sub: 'Listos para asignar' },
  { valor: 4, label: 'Activos asignados', sub: 'Actualmente en uso' },
  { valor: 1, label: 'En mantenimiento', sub: 'Requieren seguimiento' },
]

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
  const primerNombre = usuario
    .split('@')[0]
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .split(' ')[0]

  return (
    <DashboardInicio
      tema="soporte"
      eyebrow="Centro de operaciones TI"
      titulo={`Hola, ${primerNombre}`}
      texto="Gestiona la atención de tickets y las operaciones diarias del inventario tecnológico."
      boton={{ texto: 'Gestionar tickets', ruta: 'gestionar-ticket' }}
      stats={stats}
      accesos={accesos}
      base="/soporte"
      usuario={usuario}
      rol={rol}
    />
  )
}

export default InicioSoporte