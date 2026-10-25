import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import api, { descargarActa, formatoFecha, mensajeError } from '../api/cliente'
import './FirmarActa.css'

const tipoCorto = { Entrega: 'Entrega', Devolucion: 'Devolución', Prestamo: 'Préstamo' }
const verbo = { Entrega: 'recepción', Devolucion: 'devolución', Prestamo: 'recepción en préstamo' }

/**
 * HU-18 / RF08: el colaborador revisa y firma electrónicamente sus actas.
 * Al firmar, el backend registra nombre, fecha, hora e IP y genera un PDF
 * firmado nuevo (el original no se modifica).
 */
function FirmarActa() {
  const { usuario } = useOutletContext()
  const [actas, setActas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [seleccionadaId, setSeleccionadaId] = useState(null)
  const [nombreFirma, setNombreFirma] = useState('')
  const [confirmo, setConfirmo] = useState(false)
  const [firmando, setFirmando] = useState(false)

  useEffect(() => {
    // El backend devuelve solo las actas del colaborador autenticado
    api.get('/api/actas')
      .then((res) => {
        setActas(res.data)
        const primera = res.data.find((a) => a.estado === 'pendiente_firma') || res.data[0]
        if (primera) setSeleccionadaId(primera.id)
      })
      .catch((err) => setError(mensajeError(err, 'No se pudieron cargar tus actas.')))
      .finally(() => setCargando(false))
  }, [])

  const acta = actas.find((a) => a.id === seleccionadaId)
  const equipo = acta?.equipos[0]
  const pendientes = actas.filter((a) => a.estado === 'pendiente_firma').length
  const pendiente = acta?.estado === 'pendiente_firma'

  function seleccionar(id) {
    setSeleccionadaId(id)
    setNombreFirma('')
    setConfirmo(false)
  }

  async function handleFirmar(e) {
    e.preventDefault()
    if (!confirmo || !nombreFirma.trim()) return
    setFirmando(true)
    try {
      const { data } = await api.post(`/api/actas/${acta.id}/firmar`, { nombre: nombreFirma, acepto: confirmo })
      setActas((prev) => prev.map((a) => (a.id === data.id ? data : a)))
      setNombreFirma('')
      setConfirmo(false)
    } catch (err) {
      alert(mensajeError(err, 'No se pudo firmar el acta.'))
    } finally {
      setFirmando(false)
    }
  }

  async function abrir(descargar) {
    try {
      await descargarActa(acta.id, !descargar)
    } catch (err) {
      alert(mensajeError(err, 'No se pudo obtener el PDF del acta.'))
    }
  }

  return (
    <div className="fa-wrap">
      <div className="fa-header">
        <div>
          <h1>Firmar acta</h1>
          <p>Revisa y firma las actas de entrega o devolución generadas por Soporte.</p>
        </div>
        <div className="fa-pendientes-card">
          <span className="fa-pendientes-num">{pendientes}</span>
          Pendientes de firma
        </div>
      </div>

      {cargando && <p>Cargando...</p>}
      {error && <p>{error}</p>}
      {!cargando && !error && actas.length === 0 && <p>Aún no tienes actas. Aparecerán aquí cuando Soporte te entregue o reciba un equipo.</p>}

      {acta && (
        <div className="fa-layout">
          <div className="fa-lista">
            <h4>Mis actas</h4>
            {actas.map((a) => (
              <button
                key={a.id}
                className={`fa-item${a.id === seleccionadaId ? ' active' : ''}`}
                onClick={() => seleccionar(a.id)}
              >
                <div className="fa-item-top">
                  <span className="fa-item-id">{a.codigo}</span>
                  <span className={`fa-badge ${a.estado === 'pendiente_firma' ? 'badge-pendiente' : 'badge-firmada'}`}>
                    {a.estado === 'pendiente_firma' ? 'Pendiente' : a.estado === 'firmada' ? 'Firmada' : 'Anulada'}
                  </span>
                </div>
                <div className="fa-item-tipo">Acta de {tipoCorto[a.tipo]?.toLowerCase()}</div>
                <div className="fa-item-activo">{a.equipos[0] ? `${[a.equipos[0].marca, a.equipos[0].modelo].filter(Boolean).join(' ')}` : '—'}</div>
                <div className="fa-item-fecha">{formatoFecha(a.fechaGeneracion)}</div>
              </button>
            ))}
          </div>

          <div className="fa-detalle">
            <div className="fa-detalle-head">
              <div>
                <span className="fa-detalle-eyebrow">Acta digital</span>
                <h2>{acta.codigo} · {tipoCorto[acta.tipo]}</h2>
              </div>
              <span className={`fa-badge ${pendiente ? 'badge-pendiente' : 'badge-firmada'}`}>
                {pendiente ? 'Firma pendiente' : 'Firmada'}
              </span>
            </div>

            <div className="fa-documento">
              <div className="fa-doc-head">
                <span className="fa-doc-marca">Terpel</span>
                <div className="fa-doc-meta">
                  <div>{acta.codigo}</div>
                  <div>{formatoFecha(acta.fechaGeneracion, true)}</div>
                </div>
              </div>

              <h3>Acta de {tipoCorto[acta.tipo]?.toLowerCase()} de activo</h3>
              <p className="fa-doc-texto">
                Yo, <strong>{acta.colaborador}</strong>, confirmo la {verbo[acta.tipo]} del activo tecnológico
                descrito a continuación y declaro haber verificado la información registrada.
              </p>

              <div className="fa-doc-grid">
                <div><span>Activo</span><strong>{equipo ? `${equipo.categoria} ${[equipo.marca, equipo.modelo].filter(Boolean).join(' ')}` : '—'}</strong></div>
                <div><span>Código</span><strong>{equipo?.codigoPatrimonial || '—'}</strong></div>
                <div><span>N.° de serie</span><strong>{equipo?.numeroSerie || '—'}</strong></div>
                <div><span>Ticket relacionado</span><strong>#{acta.ticketId}</strong></div>
                <div><span>Generado por</span><strong>{acta.tecnico}</strong></div>
              </div>

              <div className="fa-doc-obs">
                <span>Observaciones</span>
                <p>{acta.observacion || 'Ninguna'}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
              <button type="button" onClick={() => abrir(false)}>Ver PDF{pendiente ? '' : ' firmado'}</button>
              <button type="button" onClick={() => abrir(true)}>↓ Descargar</button>
            </div>

            {pendiente ? (
              <form className="fa-firma-box" onSubmit={handleFirmar}>
                <h4>Firma electrónica</h4>
                <p>Escribe tu nombre completo tal como está registrado: <strong>{acta.colaborador}</strong></p>
                <input
                  type="text"
                  placeholder={acta.colaborador || usuario}
                  value={nombreFirma}
                  onChange={(e) => setNombreFirma(e.target.value)}
                />
                <label className="fa-checkbox">
                  <input
                    type="checkbox"
                    checked={confirmo}
                    onChange={(e) => setConfirmo(e.target.checked)}
                  />
                  Confirmo que revisé la información del acta y acepto firmarla electrónicamente.
                </label>
                <button type="submit" disabled={!confirmo || !nombreFirma.trim() || firmando}>
                  {firmando ? 'Firmando...' : 'Firmar acta'}
                </button>
              </form>
            ) : (
              <div className="fa-ya-firmada">
                ✓ Firmada por {acta.firmaNombre} el {formatoFecha(acta.firmaFecha, true)}.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default FirmarActa
