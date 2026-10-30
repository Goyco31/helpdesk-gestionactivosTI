import { useEffect, useState } from 'react'
import api, { correoActual, mensajeError } from '../api/cliente'
import './GestionarRoles.css'

const permisos = [
  { funcion: 'Crear y consultar tickets', usr: true, sop: true, adm: true },
  { funcion: 'Gestionar inventario y activos', usr: false, sop: true, adm: true },
  { funcion: 'Generar actas y trazabilidad', usr: false, sop: true, adm: true },
  { funcion: 'Registrar usuarios', usr: false, sop: false, adm: true },
  { funcion: 'Gestionar roles y reportes', usr: false, sop: false, adm: true },
]

function iniciales(nombre) {
  return nombre.split(' ').filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

function GestionarRoles() {
  const [usuarios, setUsuarios] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [guardandoId, setGuardandoId] = useState(null)
  const miCorreo = correoActual()

  useEffect(() => {
    // Usuarios reales registrados en PostgreSQL
    api.get('/api/usuarios')
      .then((res) => setUsuarios(res.data))
      .catch((err) => setError(mensajeError(err, 'No se pudo cargar la lista de usuarios.')))
      .finally(() => setCargando(false))
  }, [])

  async function cambiarRol(usuario, nuevoRol) {
    if (!window.confirm(`¿Cambiar el rol de ${usuario.nombreCompleto} a ${nuevoRol}?`)) return
    setGuardandoId(usuario.id)
    try {
      // HU-14: el backend valida que no sea tu propia cuenta y que quede al menos un admin
      const { data } = await api.patch(`/api/usuarios/${usuario.id}/rol`, { rol: nuevoRol.toLowerCase() })
      setUsuarios((prev) => prev.map((u) => (u.id === data.id ? data : u)))
    } catch (err) {
      alert(mensajeError(err, 'No se pudo cambiar el rol.'))
    } finally {
      setGuardandoId(null)
    }
  }

  const texto = busqueda.toLowerCase()
  const usuariosFiltrados = usuarios.filter(
    (u) =>
      u.nombreCompleto.toLowerCase().includes(texto) ||
      u.correo.toLowerCase().includes(texto)
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
              <span>{cargando ? 'Cargando...' : `${usuarios.length} cuentas registradas`}</span>
            </div>
            <input
              type="text"
              placeholder="Buscar usuario..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className="gr-lista">
            {error && <div className="gr-item-correo">{error}</div>}
            {!cargando && !error && usuariosFiltrados.length === 0 && (
              <div className="gr-item-correo">No se encontraron usuarios.</div>
            )}
            {usuariosFiltrados.map((u) => {
              const esYo = miCorreo && u.correo.toLowerCase() === miCorreo.toLowerCase()
              const detalle = [u.area, u.sede].filter(Boolean).join(' · ')
              return (
                <div key={u.id} className="gr-item">
                  <div className="gr-avatar">{iniciales(u.nombreCompleto)}</div>
                  <div className="gr-item-info">
                    <div className="gr-item-nombre">{u.nombreCompleto}{esYo ? ' (tú)' : ''}</div>
                    <div className="gr-item-correo">{u.correo}{detalle ? ` · ${detalle}` : ''}</div>
                  </div>
                  <select
                    value={u.rol}
                    onChange={(e) => cambiarRol(u, e.target.value)}
                    disabled={esYo || guardandoId === u.id}
                    title={esYo ? 'No puedes cambiar tu propio rol' : ''}
                  >
                    <option value="Usuario">Usuario</option>
                    <option value="Soporte">Soporte</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              )
            })}
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