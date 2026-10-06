import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import Cadastros from './pages/Cadastros'
import Pacientes from './pages/Pacientes'
import Login from './pages/Login'
import AccountSettings from './pages/AccountSettings'
import Users from './pages/Users'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import { ModalProvider } from './contexts/ModalContext'
import { CadastrosProvider } from './contexts/CadastrosContext'
import { AuthProvider, useAuth } from './hooks/use-auth'

const ProtectedRoutes = () => {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return (
    <CadastrosProvider>
      <ModalProvider>
        <Outlet />
      </ModalProvider>
    </CadastrosProvider>
  )
}

const PublicRoutes = () => {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/" replace />
  return <Outlet />
}

const App = () => (
  <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route element={<ProtectedRoutes />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/cadastros" element={<Cadastros />} />
              <Route path="/pacientes" element={<Pacientes />} />
              <Route path="/conta" element={<AccountSettings />} />
              <Route path="/usuarios" element={<Users />} />
            </Route>
          </Route>
          <Route element={<PublicRoutes />}>
            <Route path="/login" element={<Login />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
