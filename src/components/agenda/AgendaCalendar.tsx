import {
  format,
  isSameDay,
  isSameMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday,
  startOfMonth,
  endOfMonth,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { STATUS_COLORS } from '@/lib/agenda-utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import pb from '@/lib/pocketbase/client'
import { useModals } from '@/contexts/ModalContext'

interface Props {
  currentDate: Date
  viewMode: 'day' | 'week' | 'month'
  agendamentos: any[]
}

export function AgendaCalendar({ currentDate, viewMode, agendamentos }: Props) {
  const { openEditAppointment } = useModals()

  if (viewMode === 'day') {
    // Detailed Timeline for the Day
    const hours = Array.from({ length: 14 }, (_, i) => i + 7) // 7:00 to 20:00
    return (
      <div className="bg-elevated border border-border rounded-xl shadow-subtle flex flex-col divide-y divide-border animate-fade-in-up">
        {hours.map((h) => {
          const slotEvents = agendamentos.filter((a) => new Date(a.dataHora).getHours() === h)
          return (
            <div
              key={h}
              className="flex min-h-[80px] group hover:bg-accent-primary-banner/10 transition-colors"
            >
              <div className="w-20 border-r border-border p-4 text-xs font-mono font-bold text-subtle text-right bg-secondary/30">
                {h.toString().padStart(2, '0')}:00
              </div>
              <div className="flex-1 p-3 flex flex-col gap-2">
                {slotEvents.map((evt) => (
                  <button
                    key={evt.id}
                    type="button"
                    onClick={() => openEditAppointment(evt)}
                    title="Editar / remarcar"
                    className={cn(
                      'text-left border p-3 rounded-lg shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 animate-slide-up cursor-pointer hover:shadow-md hover:brightness-[0.98] transition-all',
                      STATUS_COLORS[evt.status] || 'bg-elevated border-border text-deep',
                    )}
                  >
                    <div className="flex-1 flex justify-between sm:justify-start items-start sm:items-center gap-2">
                      <div>
                        <div className="font-bold tracking-tight text-base text-slate-900 dark:text-slate-100">
                          {evt.expand?.paciente?.nome}
                        </div>
                        <div className="text-[10px] uppercase font-bold tracking-wider opacity-80 mt-0.5 text-slate-600 dark:text-slate-400">
                          {evt.expand?.tipo?.nome}
                        </div>
                      </div>
                      <div className="sm:hidden text-xs font-mono font-bold bg-white/50 dark:bg-black/20 px-2.5 py-1.5 rounded shadow-sm border border-black/5 dark:border-white/5 text-slate-900 dark:text-slate-100">
                        {format(new Date(evt.dataHora), 'HH:mm')}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <div className="flex items-center gap-2.5 bg-white/50 dark:bg-black/10 px-2.5 py-1.5 rounded-md border border-black/5 dark:border-white/5 flex-1 sm:flex-initial sm:min-w-[160px] max-w-[220px]">
                        <Avatar className="h-7 w-7 border border-black/10 dark:border-white/10 shadow-sm shrink-0">
                          {evt.expand?.profissional?.foto && (
                            <AvatarImage
                              src={pb.files.getURL(
                                evt.expand.profissional,
                                evt.expand.profissional.foto,
                              )}
                              alt={evt.expand?.profissional?.nome}
                            />
                          )}
                          <AvatarFallback className="bg-background/50 text-xs font-medium">
                            {evt.expand?.profissional?.nome?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col overflow-hidden">
                          <span
                            className="text-xs font-bold leading-none truncate text-slate-900 dark:text-slate-100"
                            title={evt.expand?.profissional?.nome}
                          >
                            {evt.expand?.profissional?.nome}
                          </span>
                          <span className="text-[9px] uppercase tracking-wider opacity-70 mt-1 truncate text-slate-600 dark:text-slate-400">
                            Profissional
                          </span>
                        </div>
                      </div>

                      <div className="hidden sm:block text-xs font-mono font-bold bg-white/50 dark:bg-black/20 px-2.5 py-1.5 rounded shadow-sm border border-black/5 dark:border-white/5 shrink-0 text-slate-900 dark:text-slate-100">
                        {format(new Date(evt.dataHora), 'HH:mm')}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Week & Month Grid Layout
  const start = startOfWeek(viewMode === 'week' ? currentDate : startOfMonth(currentDate), {
    weekStartsOn: 0,
  })
  const end = endOfWeek(viewMode === 'week' ? currentDate : endOfMonth(currentDate), {
    weekStartsOn: 0,
  })
  const days = eachDayOfInterval({ start, end })

  return (
    <div className="bg-elevated border border-border rounded-xl overflow-hidden shadow-subtle animate-fade-in-up">
      {/* Header Days */}
      <div className="grid grid-cols-7 border-b border-border bg-base">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
          <div
            key={d}
            className="py-3 text-center text-[11px] font-bold uppercase tracking-wider text-subtle"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid Cells */}
      <div className="grid grid-cols-7 bg-border gap-px">
        {days.map((day) => {
          const evts = agendamentos.filter((a) => isSameDay(new Date(a.dataHora), day))
          const isCurrentMonth = isSameMonth(day, currentDate)
          return (
            <div
              key={day.toISOString()}
              className={cn(
                'bg-base p-1.5 flex flex-col transition-colors',
                viewMode === 'week' ? 'min-h-[400px]' : 'min-h-[120px]',
                !isCurrentMonth && viewMode === 'month' && 'bg-secondary/30 opacity-60',
              )}
            >
              <div
                className={cn(
                  'text-xs p-1 mb-1 font-medium text-right',
                  isToday(day) &&
                    'text-lavender-600 font-bold bg-lavender-50 rounded-md inline-block ml-auto px-2',
                )}
              >
                {format(day, 'd')}
              </div>
              <div className="flex-1 space-y-1.5 overflow-y-auto no-scrollbar pb-1">
                {evts.map((evt) => (
                  <button
                    key={evt.id}
                    type="button"
                    onClick={() => openEditAppointment(evt)}
                    title="Editar / remarcar"
                    className={cn(
                      'w-full text-left text-[10px] px-2 py-1 rounded border flex flex-col gap-0.5 cursor-pointer hover:opacity-80 hover:shadow-sm transition-all',
                      STATUS_COLORS[evt.status] || 'bg-secondary text-subtle border-border',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {format(new Date(evt.dataHora), 'HH:mm')}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider opacity-70 text-slate-600 dark:text-slate-400">
                        {evt.status}
                      </span>
                    </div>
                    <span className="truncate font-medium text-slate-900 dark:text-slate-100">
                      {evt.expand?.paciente?.nome}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
