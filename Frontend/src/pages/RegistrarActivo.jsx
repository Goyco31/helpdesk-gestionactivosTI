import { useState } from 'react'
import axios from 'axios'
import './RegistrarActivo.css'

const categorias = ['Laptop', 'CPU', 'Monitor', 'Impresora', 'TV', 'ClickShare', 'Router', 'Switch', 'Servidor']
const sedes = ['San Isidro', 'Callao', 'Arequipa', 'Trujillo']
const sociedades = ['Terpel Perú', 'Terpel Comercial Perú', 'Planta']

function RegistrarActivo() {
  const [categoria, setCategoria] = useState(categorias[0])
  const [sede, setSede] = useState(sedes[0])
  const [sociedad, setSociedad] = useState(sociedades[0])
  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [numeroSerie, setNumeroSerie] = useState('')
  const [codigo, setCodigo] = useState('TERPEL ')
  
  const [registrado, setRegistrado] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleCodigoChange = (e) => {
    const prefijo = "TERPEL "
    const valorActual = e.target.value

    if (!valorActual.startsWith(prefijo)) {
      setCodigo(prefijo)
      return
    }

    const numerosIngresados = valorActual.slice(prefijo.length)
    
    if (/^\d{0,8}$/.test(numerosIngresados)) {
      setCodigo(valorActual)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!marca.trim() || !modelo.trim() || codigo === 'TERPEL ' || !numeroSerie.trim()) return

    setLoading(true)
    try {
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/activos/registrar`
      
      const token = localStorage.getItem('token')

      await axios.post(url, {
        codigoPatrimonial: codigo,
        numeroSerie: numeroSerie,
        categoria: categoria,
        marca: marca,
        modelo: modelo,
        sede: sede,
        sociedad: sociedad
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      setRegistrado(true)
      setMarca('')
      setModelo('')
      setNumeroSerie('')
      setCodigo('TERPEL ') 

      setTimeout(() => setRegistrado(false), 2500)
    } catch (error) {
      console.error("Error al registrar activo:", error)
      // El backend devuelve el motivo exacto en "mensaje" (ej. código duplicado -> 409)
      const mensaje = error.response?.data?.mensaje
      alert(mensaje || "Error: verifica los datos o que tu sesión siga activa.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rac-wrap">
      <h1>Registrar activo</h1>
      <p className="rac-subtitle"><strong>RF04</strong> — Incorpora un nuevo activo tecnológico al inventario.</p>

      <form className="rac-card" onSubmit={handleSubmit}>
        <div className="rac-row">
          <label>
            Categoría
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label>
            Sociedad
            <select value={sociedad} onChange={(e) => setSociedad(e.target.value)}>
              {sociedades.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>

        <div className="rac-row">
          <label>
            Sede
            <select value={sede} onChange={(e) => setSede(e.target.value)}>
              {sedes.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label>
            Código de inventario
            <input 
              type="text" 
              placeholder="TERPEL 00000000" 
              value={codigo} 
              onChange={handleCodigoChange} 
              required 
            />
          </label>
        </div>

        <div className="rac-row">
          <label>
            Marca
            <input type="text" placeholder="Ej. HP, Dell, Lenovo" value={marca} onChange={(e) => setMarca(e.target.value)} required />
          </label>
          <label>
            Modelo
            <input type="text" placeholder="Ej. EliteDesk 800" value={modelo} onChange={(e) => setModelo(e.target.value)} required />
          </label>
        </div>

        <label>
          N° de Serie
          <input type="text" placeholder="S/N del fabricante" value={numeroSerie} onChange={(e) => setNumeroSerie(e.target.value)} required />
        </label>

        <div className="rac-estado-inicial">
          Estado inicial: <span className="rac-badge">Disponible</span>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : registrado ? 'Activo registrado ✓' : 'Registrar activo'}
        </button>
      </form>
    </div>
  )
}

export default RegistrarActivo