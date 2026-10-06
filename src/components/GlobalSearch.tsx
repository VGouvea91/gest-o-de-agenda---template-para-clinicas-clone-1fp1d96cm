import { useState, useEffect } from 'react'
import { UserRound, Stethoscope } from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { useNavigate } from 'react-router-dom'
import { searchPacientes } from '@/services/pacientes'
import { useCadastros } from '@/contexts/CadastrosContext'
import { useModals } from '@/contexts/ModalContext'

export function GlobalSearch() {
  const { isSearchOpen, setSearchOpen, setPreSelectedPatient, setNewAppointmentOpen } = useModals()
  const [query, setQuery] = useState('')
  const [pacientes, setPacientes] = useState<any[]>([])
  const { profissionais } = useCadastros()
  const navigate = useNavigate()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSearchOpen(!isSearchOpen)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [isSearchOpen, setSearchOpen])

  // Reset query whenever the dialog closes
  useEffect(() => {
    if (!isSearchOpen) setQuery('')
  }, [isSearchOpen])

  useEffect(() => {
    const fetchPacientes = async () => {
      if (query.length < 2) {
        setPacientes([])
        return
      }
      try {
        const res = await searchPacientes(query)
        setPacientes(res.items || [])
      } catch {
        setPacientes([])
      }
    }

    const debounce = setTimeout(fetchPacientes, 300)
    return () => clearTimeout(debounce)
  }, [query])

  const filteredProfissionais = profissionais.filter((p: any) =>
    p.nome.toLowerCase().includes(query.toLowerCase()),
  )

  const close = () => setSearchOpen(false)

  const handleSelectPaciente = (paciente: any) => {
    close()
    setPreSelectedPatient(paciente)
    setNewAppointmentOpen(true)
  }

  const handleSelectProfissional = () => {
    close()
    navigate('/cadastros')
  }

  return (
    <CommandDialog open={isSearchOpen} onOpenChange={setSearchOpen}>
      <CommandInput
        placeholder="Buscar pacientes ou profissionais..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {query.length < 2 ? 'Digite ao menos 2 caracteres...' : 'Nenhum resultado encontrado.'}
        </CommandEmpty>

        {pacientes.length > 0 && (
          <CommandGroup heading="Pacientes">
            {pacientes.map((p) => (
              <CommandItem
                key={p.id}
                value={`${p.nome} ${p.cpf || ''}`}
                onSelect={() => handleSelectPaciente(p)}
                className="cursor-pointer"
              >
                <UserRound className="mr-2 h-4 w-4 text-lavender-500" />
                <span className="font-medium">{p.nome}</span>
                <span className="ml-auto text-xs text-subtle">Novo agendamento</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredProfissionais.length > 0 && (
          <CommandGroup heading="Profissionais">
            {filteredProfissionais.map((p: any) => (
              <CommandItem
                key={p.id}
                value={`${p.nome} ${p.especialidade || ''}`}
                onSelect={handleSelectProfissional}
                className="cursor-pointer"
              >
                <Stethoscope className="mr-2 h-4 w-4 text-mint" />
                <span className="font-medium">{p.nome}</span>
                <span className="ml-auto text-xs text-subtle">{p.especialidade}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
