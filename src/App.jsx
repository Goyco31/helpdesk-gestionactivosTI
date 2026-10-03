import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import UsuarioLayout from './layouts/UsuarioLayout'
import MisTickets from './pages/MisTickets'
import CrearTicket from './pages/CrearTicket'
import FirmarActa from './pages/FirmarActa'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      {/* Soporte TI y Administrador siguen usando el dashboard de tarjetas */}
      <Route path="/dashboard" element={<Dashboard />} />

      {/* Usuario Final tiene su propio layout con menú lateral */}
      <Route path="/usuario" element={<UsuarioLayout />}>
        <Route path="mis-solicitudes" element={<MisTickets />} />
        <Route path="crear-ticket" element={<CrearTicket />} />
        <Route path="firmar-acta" element={<FirmarActa />} />
      </Route>

      {/* Cualquier ruta que no exista, vuelve al login */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App