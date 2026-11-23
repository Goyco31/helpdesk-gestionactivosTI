import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import api from '../api/cliente'
import './Inicio.css'

const ACTIVOS = ['Abierto', 'En Proceso']
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`

function Inicio() {
  const { usuario, rol } = useOutletContext()
  const navigate = useNavigate()
  // null = cargando o sin datos (se muestra "—")
  const [resumen, setResumen] = useState({ activas: null, resueltas: null, total: null, pendientes: null })

  const primerNombre = usuario
    .split('@')[0]
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .split(' ')[0]

  useEffect(() => {
    // El backend devuelve solo los tickets y actas del usuario autenticado
    Promise.allSettled([api.get('/api/tickets'), api.get('/api/actas')]).then(([tickets, actas]) => {
      const lista = tickets.status === 'fulfilled' ? tickets.value.data : null
      const docs = actas.status === 'fulfilled' ? actas.value.data : null
      setResumen({
        activas: lista && lista.filter((t) => ACTIVOS.includes(t.estado)).length,
        resueltas: lista && lista.filter((t) => !ACTIVOS.includes(t.estado)).length,
        total: lista && lista.length,
        pendientes: docs && docs.filter((a) => a.estado === 'pendiente_firma').length,
      })
    })
  }, [])

  const valor = (n) => (n == null ? '—' : n)

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
          <div className="in-stat-num">{valor(resumen.activas)}</div>
          <div className="in-stat-label">Solicitudes activas</div>
          <div className="in-stat-sub">Abiertas o en atención por Soporte</div>
        </div>
        <div className="in-stat">
          <div className="in-stat-num">{valor(resumen.resueltas)}</div>
          <div className="in-stat-label">Solicitudes resueltas</div>
          <div className="in-stat-sub">Resueltas o cerradas</div>
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
            <span>{resumen.total == null ? 'Ver solicitudes' : plural(resumen.total, 'solicitud registrada', 'solicitudes registradas')}</span>
            <span className="in-flecha">→</span>
          </div>
        </button>

        <button className="in-opcion" onClick={() => ir('mis-activos')}>
          <span className="in-opcion-icono rojo">▣</span>
          <h3>Mis activos</h3>
          <p>Revisa los equipos que tienes asignados actualmente a tu nombre.</p>
          <div className="in-opcion-pie">
            <span>Ver equipos</span>
            <span className="in-flecha">→</span>
          </div>
        </button>

        <button className="in-opcion" onClick={() => ir('firmar-acta')}>
          <span className="in-opcion-icono ambar">✓</span>
          <h3>Firmar acta</h3>
          <p>Revisa y firma digitalmente tus actas pendientes de entrega o devolución.</p>
          <div className="in-opcion-pie">
            <span>{resumen.pendientes == null ? 'Ver actas' : plural(resumen.pendientes, 'documento pendiente', 'documentos pendientes')}</span>
            <span className="in-flecha">→</span>
          </div>
        </button>
      </div>
    </div>
  )
}

export default Inicio
