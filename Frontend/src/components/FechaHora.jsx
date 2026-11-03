/** Fecha y hora de un ticket o comentario (fecha arriba y hora abajo, o en una línea). */
function FechaHora({ valor, clase, enLinea = false }) {
  if (!valor) return <span className={`${clase}-fecha-vacia`}>—</span>
  const d = new Date(valor)
  const fecha = d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const hora = d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false })
  if (enLinea) return <>{fecha} · {hora}</>
  return (
    <div className={`${clase}-fecha`}>
      <span>{fecha}</span>
      <small>{hora}</small>
    </div>
  )
}

export default FechaHora
