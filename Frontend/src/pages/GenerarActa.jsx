import { useEffect, useState } from 'react'
import api, { descargarActa, formatoFecha, mensajeError } from '../api/cliente'
import './GenerarActa.css'

const titulo = {
  Entrega: 'Hoja de entrega de equipo',
  Devolucion: 'Hoja de devolución de equipo',
  Prestamo: 'Hoja de préstamo de equipo',
}

/**
 * Las actas se generan automaticamente al registrar una asignacion,
 * devolucion o prestamo (RF07). Esta pantalla muestra las que estan
 * pendientes de firma y permite revisarlas y descargarlas.
 */
function GenerarActa() {
  const [actas, setActas] = useState([])
  const [seleccionId, setSeleccionId] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get('/api/actas')
      .then((res) => {
        const pendientes = res.data.filter((a) => a.estado === 'pendiente_firma')
        setActas(pendientes)
        if (pendientes.length) setSeleccionId(pendientes[0].id)
      })
      .catch((err) => setError(mensajeError(err, 'No se pudieron cargar las actas.')))
      .finally(() => setCargando(false))
  }, [])

  const acta = actas.find((a) => a.id === seleccionId)
  const equipo = acta?.equipos[0]

  async function abrir(descargar) {
    try {
      await descargarActa(acta.id, !descargar)
    } catch (err) {
      alert(mensajeError(err, 'No se pudo obtener el PDF del acta.'))
    }
  }

  return (
    <div className="ga-wrap">
      <h1>Acta digital de entrega / devolución</h1>
      <p className="ga-subtitle">
        <strong>RF07</strong> — Las actas se generan automáticamente al registrar cada movimiento.
      </p>

      <div className="ga-layout">
        <div className="ga-card">
          <div className="ga-card-head">
            <h3>Pendientes de firma</h3>
            <span className="ga-badge">{actas.length}</span>
          </div>
          {cargando && <p className="ga-nota">Cargando...</p>}
          {error && <p className="ga-nota">{error}</p>}
          {!cargando && !error && actas.length === 0 && (
            <p className="ga-nota">No hay actas pendientes. Registra una asignación o devolución para generar una.</p>
          )}
          {actas.map((a) => (
            <label key={a.id} className={`ga-dropzone${a.id === seleccionId ? ' active' : ''}`}
                   style={{ cursor: 'pointer', marginBottom: 8, padding: '10px 12px', alignItems: 'flex-start' }}>
              <input type="radio" name="acta" hidden checked={a.id === seleccionId} onChange={() => setSeleccionId(a.id)} />
              <span className="ga-archivo-nombre">{a.codigo} · {titulo[a.tipo]}</span>
              <span className="ga-dropzone-sub">{a.colaborador} · ticket #{a.ticketId} · {formatoFecha(a.fechaGeneracion, true)}</span>
            </label>
          ))}
        </div>

        <div className="ga-card">
          {acta ? (
            <>
              <div className="ga-card-head">
                <h3>Acta generada — {acta.codigo}</h3>
                <span className="ga-badge">Pendiente de firma</span>
              </div>

              <div className="ga-doc">
                <div className="ga-doc-head">
                  <h4>{titulo[acta.tipo]}</h4>
                  <span>{acta.codigo}</span>
                </div>
                <p><strong>Colaborador:</strong> {acta.colaborador}</p>
                <p><strong>Activo:</strong> {equipo ? `${[equipo.marca, equipo.modelo].filter(Boolean).join(' ')} · ${equipo.codigoPatrimonial}` : '—'}</p>
                <p><strong>N.° de serie:</strong> {equipo?.numeroSerie || '—'}</p>
                <p><strong>Ticket asociado:</strong> #{acta.ticketId}</p>
                <p><strong>Fecha:</strong> {formatoFecha(acta.fechaGeneracion, true)}</p>
                <p><strong>Registrado por:</strong> {acta.tecnico}</p>

                <div className="ga-firmas">
                  <div className="ga-firma">
                    <div className="ga-firma-linea" />
                    <span>Firma colaborador</span>
                  </div>
                  <div className="ga-firma">
                    <div className="ga-firma-linea" />
                    <span>Firma soporte TI</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="ga-descargar" onClick={() => abrir(false)}>Ver PDF</button>
                <button type="button" className="ga-descargar" onClick={() => abrir(true)}>↓ Descargar PDF</button>
              </div>
              <div className="ga-rnf">archivo: {acta.archivo}</div>
            </>
          ) : (
            <p className="ga-nota">Selecciona un acta para ver su detalle.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default GenerarActa
