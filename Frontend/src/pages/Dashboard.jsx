import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { cerrarSesion, sesion } from '../api/cliente'
import './Dashboard.css'

const opcionesUsuario = [
  { titulo: 'Crear ticket', desc: 'Reporta una incidencia de equipos, aplicaciones o redes.' },
  { titulo: 'Consultar estado de tickets', desc: 'Revisa el avance de tus solicitudes.' },
  { titulo: 'Consultar mis activos', desc: 'Ve los equipos actualmente asignados a tu nombre.' },
  { titulo: 'Firmar acta digitalmente', desc: 'Firma el acta de entrega o devolución pendiente.' },
]

const opcionesSoporte = [
  { titulo: 'Gestionar tickets', desc: 'Actualiza el estado y registra comentarios de resolución.' },
  { titulo: 'Asignar activo a usuario', desc: 'Entrega un activo disponible vinculado a un ticket.' },
  { titulo: 'Registrar devolución de activo', desc: 'Marca el retorno de un activo asignado.' },
  { titulo: 'Reasignar activo', desc: 'Traslada un activo de un usuario a otro.' },
  { titulo: 'Generar acta de asignación/devolución', desc: 'Genera el PDF automático del movimiento.' },
  { titulo: 'Registrar activo', desc: 'Incorpora un nuevo activo al inventario.' },
  { titulo: 'Editar / dar de baja activo', desc: 'Actualiza datos o retira un activo del inventario.' },
  { titulo: 'Consultar inventario', desc: 'Lista completa de activos y su estado actual.' },
  { titulo: 'Consultar historial de actas', desc: 'Trazabilidad de movimientos por activo o usuario.' },
]

const opcionesAdministrador = [
  { titulo: 'Registrar usuario', desc: 'Da de alta a un colaborador con su rol correspondiente.' },
  { titulo: 'Gestionar roles y permisos', desc: 'Modifica el rol o los permisos de un usuario existente.' },
  { titulo: 'Consultar reportes de inventario', desc: 'Indicadores generales del parque tecnológico.' },
]

// El Administrador hereda todas las opciones de Soporte TI
// (incluye "Consultar historial de actas"), igual que en el
// diagrama de casos de uso (generalización).
const menuPorRol = {
  'Usuario Final': opcionesUsuario,
  'Soporte TI': opcionesSoporte,
  'Administrador': [...opcionesAdministrador, ...opcionesSoporte],
  'Admin': [...opcionesAdministrador, ...opcionesSoporte],
}

function Dashboard() {
  const { state } = useLocation()
  const navigate = useNavigate()

  // Sin sesión se vuelve al login (la ruta además está protegida en App.jsx)
  const usuario = state?.usuario || sesion().nombre
  const rol = state?.rol || sesion().rol
  if (!sesion().token || !rol) {
    return <Navigate to="/" replace />
  }
  const opciones = menuPorRol[rol] || opcionesUsuario

  // Cada rol navega dentro de su propio menú (Soporte TI ya no entra al de Administrador)
  const base = rol === 'Administrador' ? '/administrador' : rol === 'Soporte TI' ? '/soporte' : '/usuario'
  const rutasListas = {
    'Registrar usuario': 'registrar-usuario',
    'Gestionar roles y permisos': 'gestionar-roles',
    'Consultar reportes de inventario': 'reportes-inventario',
    'Gestionar tickets': 'gestionar-ticket',
    'Asignar activo a usuario': 'asignar-activo',
    'Registrar devolución de activo': 'registrar-devolucion',
    'Reasignar activo': 'reasignar-activo',
    'Generar acta de asignación/devolución': 'generar-acta',
    'Registrar activo': 'registrar-activo',
    'Editar / dar de baja activo': 'editar-activo',
    'Consultar inventario': 'consultar-inventario',
    'Consultar historial de actas': 'historial-actas',
    'Crear ticket': 'crear-ticket',
    'Consultar estado de tickets': 'mis-solicitudes',
    'Consultar mis activos': 'mis-activos',
    'Firmar acta digitalmente': 'firmar-acta',
  }

  function abrirOpcion(titulo) {
    const ruta = rutasListas[titulo] && `${base}/${rutasListas[titulo]}`
    if (ruta) {
      navigate(ruta, { state: { usuario, rol } })
    } else {
      alert(`Próximamente: ${titulo}`)
    }
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-saludo">Hola, {usuario}</p>
          <h1 className="dashboard-titulo">Activos de TI · Terpel</h1>
        </div>
        <div className="dashboard-header-right">
          <div className="dashboard-rol">{rol}</div>
          <button className="dashboard-logout" onClick={() => cerrarSesion(navigate)}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="dashboard-grid">
        {opciones.map((op) => (
          <button key={op.titulo} className="dashboard-card" onClick={() => abrirOpcion(op.titulo)}>
            <h3>{op.titulo}</h3>
            <p>{op.desc}</p>
          </button>
        ))}
      </main>
    </div>
  )
}

export default Dashboard