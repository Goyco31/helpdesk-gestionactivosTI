import { Outlet, useLocation, useNavigate, NavLink } from 'react-router-dom'
import './UsuarioLayout.css'

const navItems = [
  { to: 'mis-solicitudes', label: 'Mis solicitudes', icon: '▤' },
  { to: 'crear-ticket', label: 'Crear ticket', icon: '+' },
  { to: 'firmar-acta', label: 'Firmar acta', icon: '✓' },
]

const breadcrumbPorRuta = {
  'mis-solicitudes': 'Mis Solicitudes',
  'crear-ticket': 'Crear Ticket',
  'firmar-acta': 'Firmar Acta',
}

function UsuarioLayout() {
  const { state, pathname } = useLocation()
  const navigate = useNavigate()
  const usuario = state?.usuario || 'usuario@terpel.com'
  const rol = state?.rol || 'Usuario Final'

  const nombre = usuario.split('@')[0].replace(/[._]/g, ' ')
  const nombreCapital = nombre.replace(/\b\w/g, (l) => l.toUpperCase())
  const seccionActual = pathname.split('/').pop()
  const breadcrumb = breadcrumbPorRuta[seccionActual] || 'Mis Solicitudes'

  function cerrarSesion() {
    navigate('/', { replace: true })
  }

  return (
    <div className="ul-shell">
      <aside className="ul-sidebar">
        <div className="ul-brand">
          <div className="ul-logo">TI</div>
          <div>
            <div className="ul-brand-title">HOLA {nombreCapital.split(' ')[0].toUpperCase()}</div>
            <div className="ul-brand-sub">Bienvenido a Terpel</div>
          </div>
        </div>

        <nav className="ul-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={`/usuario/${item.to}`}
              state={{ usuario, rol }}
              className={({ isActive }) => `ul-nav-item${isActive ? ' active' : ''}`}
            >
              <span className="ul-nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ul-user">
          <div className="ul-avatar">{nombreCapital.slice(0, 2).toUpperCase()}</div>
          <div>
            <div className="ul-user-name">{nombreCapital}</div>
            <div className="ul-user-rol">Usuario</div>
          </div>
        </div>
      </aside>

      <div className="ul-main">
        <header className="ul-topbar">
          <div className="ul-breadcrumb">Terpel Perú <span>›</span> {breadcrumb}</div>
          <div className="ul-topbar-right">
            <span className="ul-rol-badge">Usuario</span>
            <button className="ul-cerrar" onClick={cerrarSesion}>Cerrar sesión</button>
          </div>
        </header>

        <div className="ul-content">
          <Outlet context={{ usuario, rol }} />
        </div>
      </div>
    </div>
  )
}

export default UsuarioLayout