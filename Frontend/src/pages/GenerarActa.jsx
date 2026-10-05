import { useState } from 'react'
import './GenerarActa.css'

// Dato de prueba — cuando exista el backend, esto vendrá de
// la última asignación/devolución confirmada (RF07).
const acta = {
  id: 'A-1043',
  colaborador: 'Jose Fernandez — Sede Lima Central',
  activo: 'HP EliteDesk 800 · TP-CP-00089',
  ticket: 'TCK-6231',
  fecha: '31/08/2026',
}

function GenerarActa() {
  const [archivo, setArchivo] = useState(null)
  const [archivado, setArchivado] = useState(false)

  function handleArchivo(e) {
    const file = e.target.files?.[0]
    if (file) setArchivo(file.name)
  }

  function handleAdjuntar() {
    if (!archivo) return
    // Mientras no hay backend, simulamos el archivado.
    // Más adelante esto será un POST a /api/actas/:id/firmada con axios (RF08).
    setArchivado(true)
  }

  return (
    <div className="ga-wrap">
      <h1>Acta digital de entrega / devolución</h1>
      <p className="ga-subtitle">
        <strong>RF07 / RF08</strong> — Generación y almacenamiento del acta firmada.
      </p>

      <div className="ga-layout">
        <div className="ga-card">
          <div className="ga-card-head">
            <h3>Acta generada — {acta.id}</h3>
            <span className="ga-badge">Generada</span>
          </div>

          <div className="ga-doc">
            <div className="ga-doc-head">
              <h4>Acta de entrega de activo</h4>
              <span>{acta.id}</span>
            </div>
            <p><strong>Colaborador:</strong> {acta.colaborador}</p>
            <p><strong>Activo:</strong> {acta.activo}</p>
            <p><strong>Ticket asociado:</strong> {acta.ticket}</p>
            <p><strong>Fecha de entrega:</strong> {acta.fecha}</p>

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

          <button type="button" className="ga-descargar" onClick={() => alert('Descargando acta en PDF (simulado)')}>
            ↓ Descargar PDF
          </button>
          <div className="ga-rnf">generación ≤ 3 seg (RNF03)</div>
        </div>

        <div className="ga-card">
          <h3>Adjuntar acta firmada</h3>

          <label className="ga-dropzone">
            <input type="file" accept="application/pdf" onChange={handleArchivo} hidden />
            <span className="ga-clip">📎</span>
            {archivo ? (
              <span className="ga-archivo-nombre">{archivo}</span>
            ) : (
              <>
                <span className="ga-dropzone-link">Arrastra el PDF escaneado aquí</span>
                <span className="ga-dropzone-sub">o selecciona un archivo</span>
              </>
            )}
          </label>

          <button
            type="button"
            className="ga-adjuntar"
            disabled={!archivo}
            onClick={handleAdjuntar}
          >
            {archivado ? 'Archivado ✓' : 'Adjuntar y archivar'}
          </button>

          <p className="ga-nota">
            El archivo quedará asociado de forma permanente al movimiento {acta.id} en el repositorio digital.
          </p>
        </div>
      </div>
    </div>
  )
}

export default GenerarActa