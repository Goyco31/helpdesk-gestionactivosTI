import { useState } from 'react'
import './GestionarRoles.css'

// Datos de prueba — cuando exista el backend, esto será
// un GET a /api/usuarios con axios.
const usuariosIniciales = [
  { id: 1, nombre: 'Jose Fernandez', correo: 'j.fernandez@terpel.com', sede: 'Lima Central', rol: 'Usuario' },
  { id: 2, nombre: 'María Torres', correo: 'm.torres@terpel.com', sede: 'Callao', rol: 'Soporte' },
  { id: 3, nombre: 'Diego Cosme', correo: 'd.cosme@terpel.com', sede: 'Arequipa', rol: 'Usuario' },
  { id: 4, nombre: 'Ana Ramírez', correo: 'a.ramirez@terpel.com', sede: 'Lima Central', rol: 'Admin' },
]

const permisos = [
  { funcion: 'Crear y consultar tickets', usr: true, sop: true, adm: true },
  { funcion: 'Gestionar inventario y activos', usr: false, sop: true, adm: true },
  { funcion: 'Generar actas y trazabilidad', usr: false, sop: true, adm: true },
  { funcion: 'Registrar usuarios', usr: false, sop: false, adm: true },
  { funcion: 'Gestionar roles y reportes', usr: false, sop: false, adm: true },
]

function iniciales(nombre) {
  return nombre.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

function GestionarRoles() {
  const [usuarios, setUsuarios] = useState(usuariosIniciales)
  const [busqueda, setBusqueda] = useState('')

  function cambiarRol(id, nuevoRol) {
    // Mientras no hay backend, actualizamos localmente.
    // Más adelante esto será un PATCH a /api/usuarios/:id con axios.
    setUsuarios((prev) => prev.map((u) => (u.id === id ? { ...u, rol: nuevoRol } : u)))
  }

  const usuariosFiltrados = usuarios.filter(
    (u) =>
      u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.correo.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div className="gr-wrap">
      <div className="gr-eyebrow">Control de acceso</div>
      <h1>Gestionar roles y permisos</h1>
      <p className="gr-subtitle">Administra el nivel de acceso de cada usuario y consulta los permisos heredados.</p>

      <div className="gr-layout">
        <div className="gr-card">
          <div className="gr-card-head">
            <div>
              <h3>Usuarios del sistema</h3>
              <span>{usuarios.length} cuentas registradas</span>
            </div>
            <input
              type="text"
              placeholder="Buscar usuario..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className="gr-lista">
            {usuariosFiltrados.map((u) => (
              <div key={u.id} className="gr-item">
                <div className="gr-avatar">{iniciales(u.nombre)}</div>
                <div className="gr-item-info">
                  <div className="gr-item-nombre">{u.nombre}</div>
                  <div className="gr-item-correo">{u.correo} · {u.sede}</div>
                </div>
                <select value={u.rol} onChange={(e) => cambiarRol(u.id, e.target.value)}>
                  <option value="Usuario">Usuario</option>
                  <option value="Soporte">Soporte</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="gr-card">
          <h3>Matriz de permisos</h3>
          <span className="gr-matriz-sub">Administrador hereda todos los permisos de Soporte.</span>

          <table className="gr-table">
            <thead>
              <tr>
                <th>Función</th>
                <th>Usr.</th>
                <th>Sop.</th>
                <th>Adm.</th>
              </tr>
            </thead>
            <tbody>
              {permisos.map((p) => (
                <tr key={p.funcion}>
                  <td>{p.funcion}</td>
                  <td className={p.usr ? 'gr-si' : 'gr-no'}>{p.usr ? '✓' : '—'}</td>
                  <td className={p.sop ? 'gr-si' : 'gr-no'}>{p.sop ? '✓' : '—'}</td>
                  <td className={p.adm ? 'gr-si' : 'gr-no'}>{p.adm ? '✓' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default GestionarRoles