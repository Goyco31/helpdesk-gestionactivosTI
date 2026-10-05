import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard' // <--- Importado aquí
import UsuarioLayout from './layouts/UsuarioLayout'
import MisTickets from './pages/MisTickets'
import CrearTicket from './pages/CrearTicket'
import FirmarActa from './pages/FirmarActa'
import AdministradorLayout from './layouts/AdministradorLayout'
import SoporteLayout from './layouts/SoporteLayout'
import RegistrarUsuario from './pages/RegistrarUsuario'
import GestionarRoles from './pages/GestionarRoles'
import ReportesInventario from './pages/ReportesInventario'
import GestionarTicket from './pages/GestionarTicket'
import AsignarActivo from './pages/AsignarActivo'
import RegistrarDevolucion from './pages/RegistrarDevolucion'
import GenerarActa from './pages/GenerarActa'
import RegistrarActivo from './pages/RegistrarActivo'
import EditarActivo from './pages/EditarActivo'
import ConsultarInventario from './pages/ConsultarInventario'
import HistorialActas from './pages/HistorialActas'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      
      {/* Ruta para el panel de tarjetas (Admin / Soporte) */}
      <Route path="/dashboard" element={<Dashboard />} /> 

      {/* Usuario Final: Layout con menú lateral */}
      <Route path="/usuario" element={<UsuarioLayout />}>
        <Route path="mis-solicitudes" element={<MisTickets />} />
        <Route path="crear-ticket" element={<CrearTicket />} />
        <Route path="firmar-acta" element={<FirmarActa />} />
      </Route>

      {/* Administrador: mismo esquema de Layout con menú lateral */}
      <Route path="/administrador" element={<AdministradorLayout />}>
        <Route path="registrar-usuario" element={<RegistrarUsuario />} />
        <Route path="gestionar-roles" element={<GestionarRoles />} />
        <Route path="reportes-inventario" element={<ReportesInventario />} />
        <Route path="gestionar-ticket" element={<GestionarTicket />} />
        <Route path="asignar-activo" element={<AsignarActivo />} />
        <Route path="registrar-devolucion" element={<RegistrarDevolucion />} />
        <Route path="generar-acta" element={<GenerarActa />} />
        <Route path="registrar-activo" element={<RegistrarActivo />} />
        <Route path="editar-activo" element={<EditarActivo />} />
        <Route path="consultar-inventario" element={<ConsultarInventario />} />
        <Route path="historial-actas" element={<HistorialActas />} />
      </Route>

      {/* Soporte TI: mismo esquema de layout, reutilizando sus pantallas */}
      <Route path="/soporte" element={<SoporteLayout />}>
        <Route path="gestionar-ticket" element={<GestionarTicket />} />
        <Route path="asignar-activo" element={<AsignarActivo />} />
        <Route path="registrar-devolucion" element={<RegistrarDevolucion />} />
        <Route path="generar-acta" element={<GenerarActa />} />
        <Route path="registrar-activo" element={<RegistrarActivo />} />
        <Route path="editar-activo" element={<EditarActivo />} />
        <Route path="consultar-inventario" element={<ConsultarInventario />} />
        <Route path="historial-actas" element={<HistorialActas />} />
      </Route>

      {/* Cualquier ruta que no exista, vuelve al login */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App