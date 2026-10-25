import { useEffect, useState } from 'react'
import api from './cliente'

/**
 * Carga un catálogo del backend (areas, sedes, sociedades, categorias, estados)
 * y devuelve la lista de nombres. Así los <select> muestran y envían
 * exactamente los valores guardados en la base de datos.
 */
export function useCatalogo(nombre) {
  const [items, setItems] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    api
      .get(`/api/catalogos/${nombre}`)
      .then((res) => setItems(res.data.map((x) => x.nombre)))
      .catch((err) => {
        console.error(`No se pudo cargar el catálogo ${nombre}:`, err)
        setError(err)
      })
  }, [nombre])

  return { items, error }
}
