import { useLocation } from 'react-router-dom'
import './Placeholder.css'

const titulos = {
  'registrar-usuario': 'Registrar usuario',
  'gestionar-roles': 'Gestionar roles y permisos',
  'reportes-inventario': 'Consultar reportes de inventario',
  'gestionar-ticket': 'Gestionar ticket',
  'asignar-activo': 'Asignar activo a usuario',
  'registrar-devolucion': 'Registrar devolución de activo',
  'reasignar-activo': 'Reasignar activo',
  'generar-acta': 'Generar acta de asignación y devolución',
  'enviar-acta': 'Enviar acta firmada',
  'registrar-activo': 'Registrar activo',
  'editar-activo': 'Editar / dar de baja activo',
  'consultar-inventario': 'Consultar inventario',
  'historial-actas': 'Consultar historial de actas',
}

function Placeholder() {
  const { pathname } = useLocation()
  const slug = pathname.split('/').pop()
  const titulo = titulos[slug] || 'Pantalla'

  return (
    <div className="ph-wrap">
      <h1>{titulo}</h1>
      <div className="ph-card">
        <div className="ph-icon">🛠️</div>
        <p>Esta pantalla todavía no está construida.</p>
        <p className="ph-sub">Dile a Claude cuándo quieres armarla y seguimos con el mismo estilo de las demás.</p>
      </div>
    </div>
  )
}

export default Placeholder