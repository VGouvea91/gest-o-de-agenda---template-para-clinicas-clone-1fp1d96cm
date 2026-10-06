import { Outlet, useLocation } from 'react-router-dom'
import { TopBanner } from './TopBanner'
import { Header } from './Header'
import { NewAppointmentModal } from './NewAppointmentModal'
import { GlobalSearch } from './GlobalSearch'
import { useAuth } from '@/hooks/use-auth'

export default function Layout() {
  const location = useLocation()
  const isLogin = location.pathname === '/login'
  const { isDemoMode } = useAuth()

  if (isLogin) {
    return <Outlet />
  }

  return (
    <div className="flex flex-col min-h-screen bg-base">
      {isDemoMode && (
        <div className="w-full bg-amber-500 text-amber-950 px-4 py-2 text-center text-sm font-medium">
          Ambiente de Teste: Os dados aqui não remetem à realidade. Para utilizar dados reais, você
          deve criar sua conta oficial.
        </div>
      )}
      <TopBanner />
      <Header />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      <NewAppointmentModal />
      <GlobalSearch />
    </div>
  )
}
