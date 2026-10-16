import { useNavigate } from 'react-router-dom'
import './DashboardInicio.css'

// Pantalla de inicio reutilizable para Soporte TI y Administrador.
// `tema` cambia los colores ('soporte' = azul, 'admin' = rojo/ámbar).
function DashboardInicio({ tema, eyebrow, titulo, texto, boton, stats, accesos, base, usuario, rol }) {
  const navigate = useNavigate()

  function ir(ruta) {
    navigate(`${base}/${ruta}`, { state: { usuario, rol } })
  }

  return (
    <div className={`di-wrap tema-${tema}`}>
      <section className="di-hero">
        <div className="di-eyebrow">{eyebrow}</div>
        <h1>{titulo}</h1>
        <p>{texto}</p>
        <button onClick={() => ir(boton.ruta)}>{boton.texto} →</button>
      </section>

      <div className="di-stats">
        {stats.map((s) => (
          <div key={s.label} className="di-stat">
            <div className="di-stat-num">{s.valor}</div>
            <div className="di-stat-label">{s.label}</div>
            <div className="di-stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <h2 className="di-titulo">Accesos rápidos</h2>
      <p className="di-sub">Selecciona una opción para comenzar.</p>

      <div className="di-accesos">
        {accesos.map((a) => (
          <button key={a.titulo} className="di-acceso" onClick={() => ir(a.ruta)}>
            <span className={`di-icono ${a.color}`}>{a.icono}</span>
            <h3>{a.titulo}</h3>
            <p>{a.desc}</p>
            <div className="di-pie"><span>→</span></div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default DashboardInicio