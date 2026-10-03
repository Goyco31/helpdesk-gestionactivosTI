import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CrearTicket from './pages/CrearTicket'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/crear-ticket" element={<CrearTicket />} />
      {/* Cualquier ruta que no exista, vuelve al login */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App