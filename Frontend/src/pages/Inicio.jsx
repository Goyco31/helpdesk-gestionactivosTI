import { useNavigate, useOutletContext } from 'react-router-dom'
import './Inicio.css'

// Datos de prueba — cuando exista el backend, estos contadores
// vendrán de un GET a /api/usuarios/me/resumen con axios.
const resumen = {
  activas: 0,
  resueltas: 4,
  solicitudesRegistradas: 4,
  documentosPendientes: 1,
}

function Inicio() {
  const { usuario, rol } = useOutletContext()
  const navigate = useNavigate()

  const nombre = usuario.split('@')[0].replace(/[._]/g, ' ')
  const primerNombre = nombre.replace(/\b\w/g, (l) => l.toUpperCase()).split(' ')[0]

  function ir(ruta) {
    navigate(`/usuario/${ruta}`, { state: { usuario, rol } })
  }

  return (
    <div className="in-wrap">
      <section className="in-hero">
        <div className="in-hero-eyebrow">Portal de autoservicio</div>
        <h1>Hola, {primerNombre}. ¿Cómo podemos ayudarte?</h1>
        <p>Gestiona tus solicitudes de soporte, consulta tus activos y firma documentos desde un solo lugar.</p>
        <button onClick={() => ir('crear-ticket')}>+ Crear ticket</button>
      </section>

      <div className="in-stats">
        <div className="in-stat">
          <div className="in-stat-num">{resumen.activas}</div>
          <div className="in-stat-label">Solicitudes activas</div>
          <div className="in-stat-sub">En atención por Soporte</div>
        </div>
        <div className="in-stat">
          <div className="in-stat-num">{resumen.resueltas}</div>
          <div className="in-stat-label">Solicitudes resueltas</div>
          <div className="in-stat-sub">Historial disponible</div>
        </div>
      </div>

      <h2 className="in-opciones-titulo">Tus opciones</h2>
      <p className="in-opciones-sub">Accede rápidamente a las funciones disponibles para tu perfil.</p>

      <div className="in-opciones">
        <button className="in-opcion" onClick={() => ir('mis-solicitudes')}>
          <span className="in-opcion-icono rojo">▤</span>
          <h3>Mis solicitudes</h3>
          <p>Consulta el estado, los comentarios del técnico y el historial de tus tickets.</p>
          <div className="in-opcion-pie">
            <span>{resumen.solicitudesRegistradas} solicitudes registradas</span>
            <span className="in-flecha">→</span>
          </div>
        </button>

        <button className="in-opcion" onClick={() => ir('firmar-acta')}>
          <span className="in-opcion-icono ambar">✓</span>
          <h3>Firmar acta</h3>
          <p>Revisa y firma digitalmente tus actas pendientes de entrega o devolución.</p>
          <div className="in-opcion-pie">
            <span>{resumen.documentosPendientes} documento pendiente</span>
            <span className="in-flecha">→</span>
          </div>
        </button>
      </div>
    </div>
  )
}

export default Inicio