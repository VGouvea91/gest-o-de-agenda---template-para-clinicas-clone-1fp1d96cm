import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { CONTAINER } from '@/lib/layout'

interface Props {
  searchPaciente: string
  setSearchPaciente: (val: string) => void
  filterProfissional: string
  setFilterProfissional: (val: string) => void
  filterTipo: string
  setFilterTipo: (val: string) => void
  filterStatus: string
  setFilterStatus: (val: string) => void
  profissionais: any[]
  tipos: any[]
}

export function AgendaFilters({
  searchPaciente,
  setSearchPaciente,
  filterProfissional,
  setFilterProfissional,
  filterTipo,
  setFilterTipo,
  filterStatus,
  setFilterStatus,
  profissionais,
  tipos,
}: Props) {
  return (
    <div className="w-full bg-base border-b border-border/50 py-3">
      <div className={cn(CONTAINER, 'flex flex-col sm:flex-row gap-3 items-center')}>
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-subtle" />
          <Input
            placeholder="Buscar por paciente..."
            value={searchPaciente}
            onChange={(e) => setSearchPaciente(e.target.value)}
            className="pl-9 h-9 bg-secondary/50 border-border shadow-none"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Select value={filterProfissional} onValueChange={setFilterProfissional}>
            <SelectTrigger className="h-9 w-full sm:w-[180px] bg-secondary/50 border-border shadow-none">
              <SelectValue placeholder="Profissional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Profissionais</SelectItem>
              {profissionais.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="h-9 w-full sm:w-[180px] bg-secondary/50 border-border shadow-none">
              <SelectValue placeholder="Tipo de Atendimento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              {tipos.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-9 w-full sm:w-[160px] bg-secondary/50 border-border shadow-none">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="aguardando">Aguardando</SelectItem>
              <SelectItem value="confirmado">Confirmado</SelectItem>
              <SelectItem value="realizado">Realizado</SelectItem>
              <SelectItem value="faltou">Faltou</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
