import { useState } from 'react'
import './RegistrarActivo.css'

const categorias = ['Laptop', 'CPU', 'Monitor', 'Impresora', 'TV', 'ClickShare', 'Router', 'Switch', 'Servidor']
const sedes = ['Lima Central', 'Callao', 'Arequipa', 'Trujillo']

function RegistrarActivo() {
  const [categoria, setCategoria] = useState(categorias[0])
  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [codigo, setCodigo] = useState('')
  const [sede, setSede] = useState(sedes[0])
  const [registrado, setRegistrado] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (!marca.trim() || !modelo.trim() || !codigo.trim()) return
    // Mientras no hay backend, simulamos el registro.
    // Más adelante esto será un POST a /api/activos con axios (RF04).
    setRegistrado(true)
    setTimeout(() => setRegistrado(false), 2500)
    setMarca(''); setModelo(''); setCodigo('')
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
            Sede
            <select value={sede} onChange={(e) => setSede(e.target.value)}>
              {sedes.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
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
          Código de inventario
          <input type="text" placeholder="Ej. TP-CP-00090" value={codigo} onChange={(e) => setCodigo(e.target.value)} required />
        </label>

        <div className="rac-estado-inicial">
          Estado inicial: <span className="rac-badge">Disponible</span>
        </div>

        <button type="submit">{registrado ? 'Activo registrado ✓' : 'Registrar activo'}</button>
      </form>
    </div>
  )
}

export default RegistrarActivo