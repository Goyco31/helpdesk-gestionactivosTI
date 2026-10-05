import { useLocation, useNavigate } from 'react-router-dom'
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
  { titulo: 'Enviar acta firmada', desc: 'Sube el acta firmada por el usuario.' },
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

  // Si alguien entra directo a /dashboard sin pasar por el login,
  // lo mandamos de vuelta.
  if (!state) {
    navigate('/', { replace: true })
    return null
  }

  const { usuario, rol } = state
  const opciones = menuPorRol[rol] || opcionesUsuario

  // Pantallas ya construidas: mapeamos el título de la tarjeta a su ruta.
  // Pantallas ya construidas: mapeamos el título de la tarjeta a su ruta corporativa.
  const rutasListas = {
    'Registrar usuario': '/administrador/registrar-usuario',
    'Gestionar roles y permisos': '/administrador/gestionar-roles',
    'Consultar reportes de inventario': '/administrador/reportes-inventario',
    'Gestionar tickets': '/administrador/gestionar-ticket',
    'Asignar activo a usuario': '/administrador/asignar-activo',
    'Registrar devolución de activo': '/administrador/registrar-devolucion',
    'Generar acta de asignación/devolución': '/administrador/generar-acta',
    'Enviar acta firmada': '/administrador/enviar-acta',
    'Registrar activo': '/administrador/registrar-activo',
    'Editar / dar de baja activo': '/administrador/editar-activo',
    'Consultar inventario': '/administrador/consultar-inventario',
    'Consultar historial de actas': '/administrador/historial-actas',
  }

  function abrirOpcion(titulo) {
    const ruta = rutasListas[titulo]
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
          <button className="dashboard-logout" onClick={() => navigate('/', { replace: true })}>
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