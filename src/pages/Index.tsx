import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertCircle, AlertTriangle } from 'lucide-react'

import { useCadastros } from '@/contexts/CadastrosContext'
import { useRealtime } from '@/hooks/use-realtime'
import { getAgendamentosByDateRange, updateAgendamentoStatus } from '@/services/agendamentos'
import { formatCurrency } from '@/lib/agenda-utils'
import { cn } from '@/lib/utils'
import { CONTAINER } from '@/lib/layout'

import { AgendaToolbar } from '@/components/agenda/AgendaToolbar'
import { AgendaList } from '@/components/agenda/AgendaList'
import { AgendaCalendar } from '@/components/agenda/AgendaCalendar'
import { AgendaFilters } from '@/components/agenda/AgendaFilters'

export default function Index() {
  const { profissionais, convenios, tipos, isLoading: loadingCadastros } = useCadastros()
  const showWarning =
    !loadingCadastros &&
    (profissionais.length === 0 || convenios.length === 0 || tipos.length === 0)

  // State
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day')
  const [layoutMode, setLayoutMode] = useState<'list' | 'calendar'>('list')

  const [agendamentos, setAgendamentos] = useState<any[]>([])
  const [loadingAgenda, setLoadingAgenda] = useState(true)

  const [searchPaciente, setSearchPaciente] = useState('')
  const [filterProfissional, setFilterProfissional] = useState('all')
  const [filterTipo, setFilterTipo] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  // Calculations
  const getRange = () => {
    if (viewMode === 'day') {
      return { start: startOfDay(currentDate), end: endOfDay(currentDate) }
    }
    if (viewMode === 'week') {
      return {
        start: startOfWeek(currentDate, { weekStartsOn: 0 }),
        end: endOfWeek(currentDate, { weekStartsOn: 0 }),
      }
    }
    return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) }
  }

  const loadAgenda = async () => {
    setLoadingAgenda(true)
    try {
      const { start, end } = getRange()
      const records = await getAgendamentosByDateRange(start, end)
      setAgendamentos(records)
    } catch {
      // Intentionally ignored
    } finally {
      setLoadingAgenda(false)
    }
  }

  useEffect(() => {
    loadAgenda()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, viewMode])

  useRealtime('agendamentos', () => {
    loadAgenda()
  })

  // Navigation Handlers
  const handlePrev = () => {
    if (viewMode === 'day') setCurrentDate(subDays(currentDate, 1))
    else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1))
    else setCurrentDate(subMonths(currentDate, 1))
  }
  const handleNext = () => {
    if (viewMode === 'day') setCurrentDate(addDays(currentDate, 1))
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1))
    else setCurrentDate(addMonths(currentDate, 1))
  }
  const handleToday = () => setCurrentDate(new Date())

  // Filter logic
  const filteredAgendamentos = agendamentos.filter((a) => {
    if (
      searchPaciente &&
      !a.expand?.paciente?.nome?.toLowerCase().includes(searchPaciente.toLowerCase())
    ) {
      return false
    }
    if (filterProfissional !== 'all' && a.profissional !== filterProfissional) {
      return false
    }
    if (filterTipo !== 'all' && a.tipo !== filterTipo) {
      return false
    }
    if (filterStatus !== 'all' && a.status !== filterStatus) {
      return false
    }
    return true
  })

  // Financial calculations for the selected period
  const aReceber = filteredAgendamentos
    .filter((a) => a.status !== 'realizado' && a.status !== 'cancelado' && a.status !== 'faltou')
    .reduce((sum, a) => sum + (a.valor || 0), 0)

  const recebido = filteredAgendamentos
    .filter((a) => a.status === 'realizado')
    .reduce((sum, a) => sum + (a.valor || 0), 0)

  const viewLabel = viewMode === 'day' ? 'Diária' : viewMode === 'week' ? 'Semanal' : 'Mensal'

  return (
    <div className="flex-1 bg-base pb-20 min-h-screen">
      {showWarning && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-3 flex items-center justify-center gap-2 text-sm text-yellow-800 font-medium">
          <AlertTriangle className="w-4 h-4" />
          <span>
            Cadastre profissionais, convênios e tipos de atendimento para utilizar a agenda.
          </span>
          <Link to="/cadastros" className="underline font-bold ml-1 hover:text-yellow-900">
            Ir para Cadastros
          </Link>
        </div>
      )}

      {/* Toolbar - Sticky */}
      <AgendaToolbar
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        viewMode={viewMode}
        setViewMode={setViewMode}
        layoutMode={layoutMode}
        setLayoutMode={setLayoutMode}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
      />

      {/* Page Header */}
      <div className="relative overflow-hidden bg-base border-b border-border/50">
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-multiply"
          style={{
            backgroundImage:
              'url("https://img.usecurling.com/p/1200/400?q=vintage%20medical%20herb")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div
          className={cn(
            CONTAINER,
            'relative z-10 pt-12 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6',
          )}
        >
          <div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-deep mb-2 tracking-tight">
              Agenda <span className="text-lavender-500 font-normal italic">· {viewLabel}</span>
            </h1>
            <p className="text-base text-subtle max-w-2xl font-medium capitalize">
              {viewMode === 'day'
                ? format(currentDate, "EEEE, dd 'de' MMMM", { locale: ptBR })
                : `Período Selecionado`}
            </p>
          </div>
        </div>
      </div>

      <AgendaFilters
        searchPaciente={searchPaciente}
        setSearchPaciente={setSearchPaciente}
        filterProfissional={filterProfissional}
        setFilterProfissional={setFilterProfissional}
        filterTipo={filterTipo}
        setFilterTipo={setFilterTipo}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        profissionais={profissionais}
        tipos={tipos}
      />

      {/* Main Container */}
      <div className={cn(CONTAINER, 'grid grid-cols-1 md:grid-cols-12 gap-6 pt-6')}>
        <div className="md:col-span-8">
          {layoutMode === 'list' ? (
            <AgendaList
              agendamentos={filteredAgendamentos}
              loading={loadingAgenda}
              viewMode={viewMode}
            />
          ) : (
            <AgendaCalendar
              currentDate={currentDate}
              viewMode={viewMode}
              agendamentos={filteredAgendamentos}
            />
          )}
        </div>

        <div className="md:col-span-4 space-y-6">
          <div
            className="bg-elevated border border-border rounded-xl shadow-sm p-4 md:p-5 flex flex-col gap-4 sticky top-36 animate-slide-up"
            style={{ animationDelay: '100ms', animationFillMode: 'both' }}
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-subtle leading-tight">
                Visão Financeira
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-3 w-full">
              <div className="bg-mint/10 rounded-xl p-3 border border-mint/20">
                <p className="text-[10px] font-bold uppercase tracking-wider text-mint-900 mb-0.5">
                  Recebido
                </p>
                <p className="font-mono text-lg font-semibold text-mint-950">
                  {formatCurrency(recebido)}
                </p>
              </div>
              <div className="bg-secondary rounded-xl p-3 border border-border">
                <p className="text-[10px] font-bold uppercase tracking-wider text-subtle mb-0.5">
                  A receber
                </p>
                <p className="font-mono text-lg font-semibold text-deep">
                  {formatCurrency(aReceber)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
