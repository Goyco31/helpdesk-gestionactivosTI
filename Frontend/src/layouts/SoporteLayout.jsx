import { Outlet, useLocation, useNavigate, NavLink } from 'react-router-dom'
import './SoporteLayout.css'

const navItems = [
  { to: 'gestionar-ticket', label: 'Gestionar ticket', icon: '▤' },
  { to: 'asignar-activo', label: 'Asignar activo', icon: '→' },
  { to: 'registrar-devolucion', label: 'Registrar devolución', icon: '↩' },
  { to: 'generar-acta', label: 'Generar acta', icon: '▦' },
  { to: 'registrar-activo', label: 'Registrar activo', icon: '+' },
  { to: 'editar-activo', label: 'Editar / dar de baja', icon: '✎' },
  { to: 'consultar-inventario', label: 'Consultar inventario', icon: '▤' },
  { to: 'historial-actas', label: 'Historial de actas', icon: '◷' },
]

function SoporteLayout() {
  const { state, pathname } = useLocation()
  const navigate = useNavigate()
  const usuario = state?.usuario || 'soporte@terpel.com'
  const rol = state?.rol || 'Soporte TI'

  const nombre = usuario.split('@')[0].replace(/[._]/g, ' ')
  const nombreCapital = nombre.replace(/\b\w/g, (l) => l.toUpperCase())

  const seccionActual = pathname.split('/').pop()
  const breadcrumb = navItems.find((i) => i.to === seccionActual)?.label || 'Soporte TI'

  function cerrarSesion() {
    navigate('/', { replace: true })
  }

  return (
    <div className="sl-shell">
      <aside className="sl-sidebar">
        <div className="sl-brand">
          <div className="sl-logo">TI</div>
          <div>
            <div className="sl-brand-title">HOLA {nombreCapital.split(' ')[0].toUpperCase()}</div>
            <div className="sl-brand-sub">Bienvenido a Terpel</div>
          </div>
        </div>

        <nav className="sl-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={`/soporte/${item.to}`}
              state={{ usuario, rol }}
              className={({ isActive }) => `sl-nav-item${isActive ? ' active' : ''}`}
            >
              <span className="sl-nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sl-user">
          <div className="sl-avatar">{nombreCapital.slice(0, 2).toUpperCase()}</div>
          <div>
            <div className="sl-user-name">{nombreCapital}</div>
            <div className="sl-user-rol">Soporte TI</div>
          </div>
        </div>
      </aside>

      <div className="sl-main">
        <header className="sl-topbar">
          <div className="sl-breadcrumb">Terpel Perú <span>›</span> {breadcrumb}</div>
          <div className="sl-topbar-right">
            <span className="sl-rol-badge">Soporte TI</span>
            <button className="sl-cerrar" onClick={cerrarSesion}>Cerrar sesión</button>
          </div>
        </header>

        <div className="sl-content">
          <Outlet context={{ usuario, rol }} />
        </div>
      </div>
    </div>
  )
}

export default SoporteLayout