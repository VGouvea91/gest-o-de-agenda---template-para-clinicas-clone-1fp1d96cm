import { Search, Stethoscope, Plus, LogOut } from 'lucide-react'
import { useModals } from '@/contexts/ModalContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { CONTAINER } from '@/lib/layout'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import pb from '@/lib/pocketbase/client'

export function Header() {
  const { setSearchOpen, setNewAppointmentOpen } = useModals()
  const location = useLocation()
  const { user, signOut } = useAuth()

  return (
    <header className="w-full border-b border-border bg-elevated shadow-sm sticky top-0 z-40">
      <div className={cn(CONTAINER, 'h-16 flex items-center justify-between')}>
        <div className="flex items-center gap-6 lg:gap-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-primary-soft flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-lavender-600" />
            </div>
            <span className="font-display font-bold text-xl text-deep tracking-tight hidden sm:block">
              ClínicaPro
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            <Link
              to="/"
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors',
                location.pathname === '/'
                  ? 'bg-accent-primary-soft text-lavender-700'
                  : 'text-subtle hover:bg-secondary',
              )}
            >
              <span className="font-mono text-xs opacity-70">I</span> Agenda
            </Link>
            <Link
              to="/cadastros"
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors',
                location.pathname === '/cadastros'
                  ? 'bg-accent-primary-soft text-lavender-700'
                  : 'text-subtle hover:bg-secondary',
              )}
            >
              <span className="font-mono text-xs opacity-70">II</span> Cadastros
            </Link>
            <Link
              to="/pacientes"
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors',
                location.pathname === '/pacientes'
                  ? 'bg-accent-primary-soft text-lavender-700'
                  : 'text-subtle hover:bg-secondary',
              )}
            >
              <span className="font-mono text-xs opacity-70">III</span> Pacientes
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3 lg:gap-4">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-secondary text-subtle hover:bg-lavender-200 transition-colors text-sm"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:block">Buscar...</span>
          </button>

          <button
            onClick={() => setNewAppointmentOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-lavender-500 text-white shadow-lavender-glow hover:bg-lavender-600 transition-all active:scale-95 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:block">Novo Agendamento</span>
          </button>

          <div className="hidden lg:block h-8 w-px bg-border mx-2" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 text-left">
                <div className="hidden lg:block">
                  <p className="text-sm font-medium text-deep leading-none">
                    {user?.name || user?.email}
                  </p>
                  <p className="text-xs text-subtle mt-1">{user?.role || 'Usuário'}</p>
                </div>
                <Avatar className="h-9 w-9 border border-border">
                  {user?.avatar && <AvatarImage src={pb.files.getURL(user, user.avatar)} />}
                  <AvatarFallback>
                    {(user?.name || user?.email || 'U')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to="/conta" className="cursor-pointer font-medium">
                  Configurações da conta
                </Link>
              </DropdownMenuItem>
              {user?.role === 'Administrador' && (
                <DropdownMenuItem asChild>
                  <Link to="/usuarios" className="cursor-pointer font-medium">
                    Gestão de equipe
                  </Link>
                </DropdownMenuItem>
              )}
              <div className="h-px bg-border my-1 mx-2" />
              <DropdownMenuItem
                onClick={signOut}
                className="text-rose-600 focus:text-rose-700 focus:bg-rose-50 cursor-pointer font-medium"
              >
                <LogOut className="mr-2 h-4 w-4" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
