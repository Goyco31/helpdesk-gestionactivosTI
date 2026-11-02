/**
 * Utilidades compartidas por las pantallas de tickets (Mis solicitudes y Gestionar ticket).
 *
 * La subcategoría y el método de contacto no tienen columna propia en la tabla ticket:
 * Crear ticket los antepone a la descripción con este formato fijo, y aquí se separan
 * para mostrarlos. Así se amplía la pantalla sin modificar el backend ni la base de datos.
 */
const PREFIJO = /^Subcategoría: (.*?) · Contacto: (.*?)\n\n/

export function armarDescripcion(subcategoria, contacto, texto) {
  return `Subcategoría: ${subcategoria} · Contacto: ${contacto}\n\n${texto.trim()}`
}

export function extraerDetalle(descripcion) {
  const m = PREFIJO.exec(descripcion || '')
  if (!m) return { subcategoria: null, contacto: null, texto: descripcion || '' }
  return { subcategoria: m[1], contacto: m[2], texto: descripcion.slice(m[0].length) }
}

/** Categoría del ticket -> color de la etiqueta (clases del CSS). */
export function claseCategoria(categoria) {
  return { Equipos: 'hardware', Aplicaciones: 'software', Redes: 'redes' }[categoria] || 'hardware'
}

export function iniciales(nombre) {
  return (nombre || '?')
    .split(/[\s@._]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}
