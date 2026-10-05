import './ReportesInventario.css'

// Datos de prueba — cuando exista el backend, esto será
// un GET a /api/reportes/inventario con axios.
const stats = [
  { valor: 8, label: 'Activos registrados', sub: '+3 este mes', color: 'dark' },
  { valor: 4, label: 'Activos asignados', sub: '50% del inventario', color: 'blue' },
  { valor: 2, label: 'Disponibles', sub: 'Listos para asignar', color: 'green' },
  { valor: 1, label: 'En mantenimiento', sub: 'Requieren seguimiento', color: 'orange' },
]

const categorias = [
  { nombre: 'Laptops', cantidad: 124 },
  { nombre: 'Monitores', cantidad: 98 },
  { nombre: 'CPU', cantidad: 72 },
  { nombre: 'Impresoras', cantidad: 45 },
  { nombre: 'Redes', cantidad: 31 },
]
const maxCategoria = Math.max(...categorias.map((c) => c.cantidad))

const actividad = [
  { tipo: 'Asignado', texto: 'Asignado a Jose Fernandez — Sede Lima Central · Ticket TCK-0231 · Acta A-1043', fecha: '31/08/2026 · 09:18' },
  { tipo: 'Devuelto', texto: 'Devuelto por María Torres — estado: Disponible · Acta A-0987', fecha: '14/07/2026 · 16:03' },
  { tipo: 'Registrado', texto: 'Registrado en inventario — Ingreso de compra, estado: Disponible', fecha: '05/03/2026 · 10:30' },
]

function ReportesInventario() {
  return (
    <div className="ri-wrap">
      <div className="ri-header">
        <div>
          <div className="ri-eyebrow">Analítica</div>
          <h1>Reportes de inventarios</h1>
          <p>Consulta el estado, distribución y movimientos de los activos tecnológicos.</p>
        </div>
        <div className="ri-controls">
          <select defaultValue="todas">
            <option value="todas">Todas las sedes</option>
          </select>
          <select defaultValue="30">
            <option value="30">Últimos 30 días</option>
          </select>
          <button>Exportar reporte</button>
        </div>
      </div>

      <div className="ri-stats">
        {stats.map((s) => (
          <div key={s.label} className="ri-stat-card">
            <div className={`ri-stat-valor color-${s.color}`}>{s.valor}</div>
            <div className="ri-stat-label">{s.label}</div>
            <div className="ri-stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="ri-layout">
        <div className="ri-card">
          <div className="ri-card-head">
            <div>
              <h3>Distribución por categoría</h3>
              <span>Todas las sedes · Últimos 30 días</span>
            </div>
            <a href="#" onClick={(e) => e.preventDefault()}>Activos registrados</a>
          </div>
          <div className="ri-barras">
            {categorias.map((c) => (
              <div key={c.nombre} className="ri-barra-row">
                <div className="ri-barra-top">
                  <span>{c.nombre}</span>
                  <span>{c.cantidad}</span>
                </div>
                <div className="ri-barra-fondo">
                  <div className="ri-barra-fill" style={{ width: `${(c.cantidad / maxCategoria) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="ri-card">
          <h3>Actividad reciente</h3>
          <span className="ri-sub-gris">Movimientos del inventario</span>
          <div className="ri-actividad">
            {actividad.map((a, i) => (
              <div key={i} className="ri-actividad-item">
                <span className="ri-dot" />
                <div>
                  <div className="ri-actividad-tipo">{a.tipo}</div>
                  <div className="ri-actividad-texto">{a.texto}</div>
                  <div className="ri-actividad-fecha">{a.fecha}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportesInventario