import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import './FirmarActa.css'

// Datos de prueba — cuando exista el backend, esto será
// un GET a /api/actas?usuario=... con axios.
const actasIniciales = [
  {
    id: 'A-1043',
    tipoCorto: 'Entrega',
    tipo: 'Acta de entrega',
    estado: 'Pendiente',
    activo: 'HP EliteDesk 800',
    codigo: 'TP-CP-00089',
    ticket: 'TCK-0231',
    generadoPor: 'Soporte TI',
    fecha: '31/08/2026',
    observaciones: 'Equipo entregado con cable de poder, teclado y mouse. Estado físico: nuevo.',
  },
  {
    id: 'A-0988',
    tipoCorto: 'Devolución',
    tipo: 'Acta de devolución',
    estado: 'Firmada',
    activo: 'Dell Latitude 5440',
    codigo: 'TP-CP-00061',
    ticket: 'TCK-0198',
    generadoPor: 'Soporte TI',
    fecha: '14/07/2026',
    observaciones: 'Equipo devuelto en buen estado, sin accesorios.',
  },
]

function FirmarActa() {
  const { usuario } = useOutletContext()
  const [actas, setActas] = useState(actasIniciales)
  const [seleccionadaId, setSeleccionadaId] = useState(actasIniciales[0].id)
  const [nombreFirma, setNombreFirma] = useState('')
  const [confirmo, setConfirmo] = useState(false)

  const acta = actas.find((a) => a.id === seleccionadaId)
  const pendientes = actas.filter((a) => a.estado === 'Pendiente').length

  function seleccionar(id) {
    setSeleccionadaId(id)
    setNombreFirma('')
    setConfirmo(false)
  }

  function handleFirmar(e) {
    e.preventDefault()
    if (!confirmo || !nombreFirma.trim()) return
    // Mientras no hay backend, simulamos la firma localmente.
    // Más adelante esto será un POST a /api/actas/:id/firmar con axios.
    setActas((prev) => prev.map((a) => (a.id === acta.id ? { ...a, estado: 'Firmada' } : a)))
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
                <span className="fa-item-id">{a.id}</span>
                <span className={`fa-badge ${a.estado === 'Pendiente' ? 'badge-pendiente' : 'badge-firmada'}`}>
                  {a.estado}
                </span>
              </div>
              <div className="fa-item-tipo">{a.tipo}</div>
              <div className="fa-item-activo">{a.activo}</div>
              <div className="fa-item-fecha">{a.fecha}</div>
            </button>
          ))}
        </div>

        <div className="fa-detalle">
          <div className="fa-detalle-head">
            <div>
              <span className="fa-detalle-eyebrow">Acta digital</span>
              <h2>{acta.id} · {acta.tipoCorto}</h2>
            </div>
            <span className={`fa-badge ${acta.estado === 'Pendiente' ? 'badge-pendiente' : 'badge-firmada'}`}>
              {acta.estado === 'Pendiente' ? 'Firma pendiente' : 'Firmada'}
            </span>
          </div>

          <div className="fa-documento">
            <div className="fa-doc-head">
              <span className="fa-doc-marca">Terpel</span>
              <div className="fa-doc-meta">
                <div>{acta.id}</div>
                <div>{acta.fecha}</div>
              </div>
            </div>

            <h3>Acta de {acta.tipoCorto.toLowerCase()} de activo</h3>
            <p className="fa-doc-texto">
              Yo, <strong>{usuario?.split('@')[0] || 'Usuario'}</strong>, confirmo la {acta.tipoCorto.toLowerCase()}{' '}
              del activo tecnológico descrito a continuación y declaro haber verificado la información registrada.
            </p>

            <div className="fa-doc-grid">
              <div>
                <span>Activo</span>
                <strong>{acta.activo}</strong>
              </div>
              <div>
                <span>Código</span>
                <strong>{acta.codigo}</strong>
              </div>
              <div>
                <span>Ticket relacionado</span>
                <strong>{acta.ticket}</strong>
              </div>
              <div>
                <span>Generado por</span>
                <strong>{acta.generadoPor}</strong>
              </div>
            </div>

            <div className="fa-doc-obs">
              <span>Observaciones</span>
              <p>{acta.observaciones}</p>
            </div>
          </div>

          {acta.estado === 'Pendiente' ? (
            <form className="fa-firma-box" onSubmit={handleFirmar}>
              <h4>Firma electrónica</h4>
              <p>Escribe tu nombre completo tal como aparece en tu credencial corporativa.</p>
              <input
                type="text"
                placeholder={usuario?.split('@')[0] || 'Tu nombre completo'}
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
              <button type="submit" disabled={!confirmo || !nombreFirma.trim()}>
                Firmar y enviar acta
              </button>
            </form>
          ) : (
            <div className="fa-ya-firmada">✓ Esta acta ya fue firmada.</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FirmarActa