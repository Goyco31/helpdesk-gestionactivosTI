import { useEffect, useState } from 'react'
import api, { formatoFecha, mensajeError } from '../api/cliente'
import { useCatalogo } from '../api/catalogos'
import './ReportesInventario.css'

const periodos = [
  { valor: 7, texto: 'Últimos 7 días' },
  { valor: 30, texto: 'Últimos 30 días' },
  { valor: 90, texto: 'Últimos 90 días' },
  { valor: 365, texto: 'Último año' },
]

const textoTipo = {
  asignacion: 'Asignado', prestamo: 'Prestado', devolucion: 'Devuelto',
  reasignacion: 'Reasignado', cambio_estado: 'Cambio de estado',
}

function textoActividad(m) {
  const actas = m.actas.map((a) => a.codigo).join(', ')
  const partes = {
    asignacion: `${m.codigoPatrimonial} asignado a ${m.usuarioDestino}`,
    prestamo: `${m.codigoPatrimonial} prestado a ${m.usuarioDestino}`,
    devolucion: `${m.codigoPatrimonial} devuelto por ${m.usuarioOrigen} — estado: ${m.estadoNuevo}`,
    reasignacion: `${m.codigoPatrimonial} de ${m.usuarioOrigen} a ${m.usuarioDestino}`,
    cambio_estado: `${m.codigoPatrimonial}: ${m.estadoAnterior} → ${m.estadoNuevo}`,
  }
  return `${partes[m.tipo] || m.codigoPatrimonial} · Ticket #${m.ticketId}${actas ? ` · ${actas}` : ''}`
}

function exportarCsv(r) {
  const filas = [
    ['Reporte de inventario y KPI', `Sede: ${r.sede}`, `Periodo: últimos ${r.dias} días`],
    [],
    ['Inventario', 'Cantidad'],
    ...Object.entries(r.inventario),
    [],
    ['Categoría', 'Cantidad'],
    ...r.porCategoria.map((c) => [c.nombre, c.cantidad]),
    [],
    ['Estado', 'Cantidad'],
    ...r.porEstado.map((c) => [c.nombre, c.cantidad]),
    [],
    ['Indicador', 'Valor', 'Meta', 'Cumple', 'Cálculo'],
    ...r.kpis.map((k) => [k.nombre, k.valor, k.meta, k.cumple ? 'Sí' : 'No', k.calculo]),
  ]
  const csv = filas.map((f) => f.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `reporte-inventario-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function ReportesInventario() {
  const { items: sedes } = useCatalogo('sedes')
  const [sede, setSede] = useState('todas')
  const [dias, setDias] = useState(30)
  const [reporte, setReporte] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Indicadores calculados desde los registros del sistema (observacion 4)
    api.get('/api/reportes/resumen', { params: { sede, dias } })
      .then((res) => { setReporte(res.data); setError(null) })
      .catch((err) => setError(mensajeError(err, 'No se pudo cargar el reporte.')))
  }, [sede, dias])

  const inv = reporte?.inventario
  const total = inv?.total || 0
  const pct = (n) => (total ? `${Math.round((n * 100) / total)}% del inventario` : '—')
  const stats = inv ? [
    { valor: inv.total, label: 'Activos registrados', sub: `+${inv.registradosEnPeriodo} en el periodo`, color: 'dark' },
    { valor: inv.asignados, label: 'Activos asignados', sub: pct(inv.asignados), color: 'blue' },
    { valor: inv.disponibles, label: 'Disponibles', sub: 'Listos para asignar', color: 'green' },
    { valor: inv.mantenimiento, label: 'En mantenimiento', sub: `${inv.paraDonarOBaja} para donar o baja`, color: 'orange' },
  ] : []
  const maxCategoria = Math.max(1, ...(reporte?.porCategoria || []).map((c) => c.cantidad))
  const periodoTexto = periodos.find((p) => p.valor === dias)?.texto

  return (
    <div className="ri-wrap">
      <div className="ri-header">
        <div>
          <div className="ri-eyebrow">Analítica</div>
          <h1>Reportes de inventarios</h1>
          <p>Consulta el estado, distribución y movimientos de los activos tecnológicos.</p>
        </div>
        <div className="ri-controls">
          <select value={sede} onChange={(e) => setSede(e.target.value)}>
            <option value="todas">Todas las sedes</option>
            {sedes.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={dias} onChange={(e) => setDias(Number(e.target.value))}>
            {periodos.map((p) => <option key={p.valor} value={p.valor}>{p.texto}</option>)}
          </select>
          <button onClick={() => reporte && exportarCsv(reporte)} disabled={!reporte}>Exportar reporte</button>
        </div>
      </div>

      {error && <p className="ri-vacio">{error}</p>}
      {!reporte && !error && <p className="ri-vacio">Cargando...</p>}

      {reporte && (
        <>
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
                  <span>{sede === 'todas' ? 'Todas las sedes' : sede} · inventario actual</span>
                </div>
              </div>
              <div className="ri-barras">
                {reporte.porCategoria.length === 0 && <div className="ri-vacio">No hay activos registrados.</div>}
                {reporte.porCategoria.map((c) => (
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
              <span className="ri-sub-gris">Movimientos del inventario · {periodoTexto}</span>
              <div className="ri-actividad">
                {reporte.actividad.length === 0 && <div className="ri-vacio">Sin movimientos en el periodo.</div>}
                {reporte.actividad.map((m) => (
                  <div key={m.id} className="ri-actividad-item">
                    <span className="ri-dot" />
                    <div>
                      <div className="ri-actividad-tipo">{textoTipo[m.tipo] || m.tipo}</div>
                      <div className="ri-actividad-texto">{textoActividad(m)}</div>
                      <div className="ri-actividad-fecha">{formatoFecha(m.fecha, true)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="ri-card ri-kpis">
            <h3>Indicadores clave (KPI) y SLA</h3>
            <span className="ri-sub-gris">
              Calculados desde los registros del sistema · {periodoTexto} · tickets por estado:{' '}
              {Object.entries(reporte.tickets).map(([e, n]) => `${e} ${n}`).join(' · ')}
            </span>
            <table className="ri-kpi-table">
              <thead>
                <tr><th>Indicador</th><th>Valor</th><th>Meta</th><th>Estado</th></tr>
              </thead>
              <tbody>
                {reporte.kpis.map((k) => (
                  <tr key={k.nombre}>
                    <td>{k.nombre}<div className="ri-kpi-calculo">{k.calculo}</div></td>
                    <td className="ri-kpi-valor">{k.valor}</td>
                    <td>{k.meta}</td>
                    <td className={k.cumple ? 'ri-kpi-ok' : 'ri-kpi-no'}>{k.valor === '—' ? 'Sin datos' : k.cumple ? '✓ Cumple' : '✗ No cumple'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

export default ReportesInventario
