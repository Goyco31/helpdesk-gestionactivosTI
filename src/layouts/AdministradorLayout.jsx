import { Outlet, useLocation, useNavigate, NavLink } from 'react-router-dom'
import './AdministradorLayout.css'

const navSections = [
  {
    titulo: 'Administración',
    items: [
      { to: 'registrar-usuario', label: 'Registrar usuario', icon: '+' },
      { to: 'gestionar-roles', label: 'Gestionar roles y permisos', icon: '⚙' },
      { to: 'reportes-inventario', label: 'Consultar reportes', icon: '▣' },
    ],
  },
  {
    titulo: 'Soporte TI (heredado)',
    items: [
      { to: 'gestionar-ticket', label: 'Gestionar ticket', icon: '▤' },
      { to: 'asignar-activo', label: 'Asignar activo', icon: '→' },
      { to: 'registrar-devolucion', label: 'Registrar devolución', icon: '↩' },
      { to: 'generar-acta', label: 'Generar acta', icon: '▦' },
      { to: 'enviar-acta', label: 'Enviar acta firmada', icon: '↑' },
      { to: 'registrar-activo', label: 'Registrar activo', icon: '+' },
      { to: 'editar-activo', label: 'Editar / dar de baja', icon: '✎' },
      { to: 'consultar-inventario', label: 'Consultar inventario', icon: '▤' },
      { to: 'historial-actas', label: 'Historial de actas', icon: '◷' },
    ],
  },
]

function AdministradorLayout() {
  const { state, pathname } = useLocation()
  const navigate = useNavigate()
  const usuario = state?.usuario || 'admin@terpel.com'
  const rol = state?.rol || 'Administrador'

  const nombre = usuario.split('@')[0].replace(/[._]/g, ' ')
  const nombreCapital = nombre.replace(/\b\w/g, (l) => l.toUpperCase())

  const seccionActual = pathname.split('/').pop()
  const todosLosItems = navSections.flatMap((s) => s.items)
  const breadcrumb = todosLosItems.find((i) => i.to === seccionActual)?.label || 'Administración'

  function cerrarSesion() {
    navigate('/', { replace: true })
  }

  return (
    <div className="al-shell">
      <aside className="al-sidebar">
        <div className="al-brand">
          <div className="al-logo">TI</div>
          <div>
            <div className="al-brand-title">HOLA {nombreCapital.split(' ')[0].toUpperCase()}</div>
            <div className="al-brand-sub">Bienvenido a Terpel</div>
          </div>
        </div>

        <nav className="al-nav">
          {navSections.map((seccion) => (
            <div key={seccion.titulo} className="al-nav-section">
              <div className="al-nav-section-titulo">{seccion.titulo}</div>
              {seccion.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={`/administrador/${item.to}`}
                  state={{ usuario, rol }}
                  className={({ isActive }) => `al-nav-item${isActive ? ' active' : ''}`}
                >
                  <span className="al-nav-icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="al-user">
          <div className="al-avatar">{nombreCapital.slice(0, 2).toUpperCase()}</div>
          <div>
            <div className="al-user-name">{nombreCapital}</div>
            <div className="al-user-rol">Administrador</div>
          </div>
        </div>
      </aside>

      <div className="al-main">
        <header className="al-topbar">
          <div className="al-breadcrumb">Terpel Perú <span>›</span> {breadcrumb}</div>
          <div className="al-topbar-right">
            <span className="al-rol-badge">Administrador</span>
            <button className="al-cerrar" onClick={cerrarSesion}>Cerrar sesión</button>
          </div>
        </header>

        <div className="al-content">
          <Outlet context={{ usuario, rol }} />
        </div>
      </div>
    </div>
  )
}

export default AdministradorLayout