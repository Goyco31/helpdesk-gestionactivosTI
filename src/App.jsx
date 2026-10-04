import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import UsuarioLayout from './layouts/UsuarioLayout'
import MisTickets from './pages/MisTickets'
import CrearTicket from './pages/CrearTicket'
import FirmarActa from './pages/FirmarActa'
import AdministradorLayout from './layouts/AdministradorLayout'
import Placeholder from './pages/Placeholder'
import RegistrarUsuario from './pages/RegistrarUsuario'
import GestionarRoles from './pages/GestionarRoles'
import ReportesInventario from './pages/ReportesInventario'
import GestionarTicket from './pages/GestionarTicket'
import AsignarActivo from './pages/AsignarActivo'
import RegistrarDevolucion from './pages/RegistrarDevolucion'
import GenerarActa from './pages/GenerarActa'

const rutasAdministradorPendientes = [
  'enviar-acta',
  'registrar-activo',
  'editar-activo',
  'consultar-inventario',
  'historial-actas',
]

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      {/* Soporte TI sigue usando el dashboard de tarjetas, por ahora */}
      <Route path="/dashboard" element={<Dashboard />} />

      {/* Usuario Final: layout con menú lateral */}
      <Route path="/usuario" element={<UsuarioLayout />}>
        <Route path="mis-solicitudes" element={<MisTickets />} />
        <Route path="crear-ticket" element={<CrearTicket />} />
        <Route path="firmar-acta" element={<FirmarActa />} />
      </Route>

      {/* Administrador: mismo esquema de layout con menú lateral */}
      <Route path="/administrador" element={<AdministradorLayout />}>
        <Route path="registrar-usuario" element={<RegistrarUsuario />} />
        <Route path="gestionar-roles" element={<GestionarRoles />} />
        <Route path="reportes-inventario" element={<ReportesInventario />} />
        <Route path="gestionar-ticket" element={<GestionarTicket />} />
        <Route path="asignar-activo" element={<AsignarActivo />} />
        <Route path="registrar-devolucion" element={<RegistrarDevolucion />} />
        <Route path="generar-acta" element={<GenerarActa />} />
        {rutasAdministradorPendientes.map((ruta) => (
          <Route key={ruta} path={ruta} element={<Placeholder />} />
        ))}
      </Route>

      {/* Cualquier ruta que no exista, vuelve al login */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App