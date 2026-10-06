import { createContext, useContext, useState, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { checkAgendamentoPrerequisites } from '@/services/cadastros'

interface ModalContextType {
  isNewAppointmentOpen: boolean
  setNewAppointmentOpen: (open: boolean) => void
  isSearchOpen: boolean
  setSearchOpen: (open: boolean) => void
  preSelectedPatient: any
  setPreSelectedPatient: (patient: any) => void
  preSelectedDate: Date | null
  setPreSelectedDate: (date: Date | null) => void
  editingAppointment: any
  openEditAppointment: (agendamento: any) => void
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

export function useModals() {
  const context = useContext(ModalContext)
  if (!context) throw new Error('useModals must be used within ModalProvider')
  return context
}

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isNewAppointmentOpen, setOpen] = useState(false)
  const [isSearchOpen, setSearchOpen] = useState(false)
  const [preSelectedPatient, setPreSelectedPatient] = useState<any>(null)
  const [preSelectedDate, setPreSelectedDate] = useState<Date | null>(null)
  const [editingAppointment, setEditingAppointment] = useState<any>(null)
  const navigate = useNavigate()

  const setNewAppointmentOpen = async (open: boolean) => {
    if (open) {
      try {
        const missing = await checkAgendamentoPrerequisites()
        if (missing.length > 0) {
          toast.error('Cadastros pendentes', {
            description: `Para agendar, cadastre ao menos um: ${missing.join(', ')}.`,
          })
          navigate('/cadastros')
          return
        }
      } catch (error) {
        console.error('Erro ao verificar pré-requisitos:', error)
        toast.error('Erro ao verificar pré-requisitos')
        return
      }
    } else {
      // Closing: clear edit state so the next "new" opens fresh.
      setEditingAppointment(null)
    }
    setOpen(open)
  }

  // Editing an existing appointment: prerequisites are guaranteed (it exists),
  // so we open directly without the prerequisite redirect.
  const openEditAppointment = (agendamento: any) => {
    setEditingAppointment(agendamento)
    setOpen(true)
  }

  return (
    <ModalContext.Provider
      value={{
        isNewAppointmentOpen,
        setNewAppointmentOpen,
        isSearchOpen,
        setSearchOpen,
        preSelectedPatient,
        setPreSelectedPatient,
        preSelectedDate,
        setPreSelectedDate,
        editingAppointment,
        openEditAppointment,
      }}
    >
      {children}
    </ModalContext.Provider>
  )
}
