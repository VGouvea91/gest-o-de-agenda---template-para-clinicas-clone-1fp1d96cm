import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, ShieldAlert, DollarSign, Loader2, Pencil } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { cn } from '@/lib/utils'
import pb from '@/lib/pocketbase/client'
import { TYPE_COLORS, TYPE_TEXT_COLORS, STATUS_COLORS } from '@/lib/agenda-utils'
import { updateAgendamentoStatus } from '@/services/agendamentos'
import { useModals } from '@/contexts/ModalContext'

function DynamicIcon({ name, className }: { name?: string; className?: string }) {
  if (!name) return <LucideIcons.Calendar className={className} />
  const Icon = (LucideIcons as any)[name]
  if (Icon) return <Icon className={className} />
  return <LucideIcons.Calendar className={className} />
}

interface Props {
  agendamentos: any[]
  loading: boolean
  viewMode: 'day' | 'week' | 'month'
}

export function AgendaList({ agendamentos, loading, viewMode }: Props) {
  const { openEditAppointment } = useModals()

  if (loading) {
    return (
      <div className="bg-elevated rounded-2xl shadow-subtle border border-border p-16 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-subtle" />
      </div>
    )
  }

  if (agendamentos.length === 0) {
    return (
      <div className="bg-elevated rounded-2xl shadow-subtle border border-border p-16 flex flex-col items-center justify-center text-center">
        <div className="w-32 h-32 mb-6 rounded-full bg-secondary flex items-center justify-center overflow-hidden border border-border">
          <img
            src="https://img.usecurling.com/p/200/200?q=stethoscope%20line%20art"
            alt="Empty"
            className="w-full h-full object-cover mix-blend-multiply opacity-50 sepia"
          />
        </div>
        <h3 className="font-display font-bold text-xl text-deep mb-2">Nenhum resultado</h3>
        <p className="text-subtle max-w-sm">
          Nenhum agendamento encontrado para os filtros selecionados.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-elevated rounded-2xl shadow-subtle border border-border overflow-hidden animate-fade-in-up">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-base border-b border-border">
              {viewMode !== 'day' && (
                <th className="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-subtle w-32 whitespace-nowrap">
                  Data
                </th>
              )}
              <th className="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-subtle w-24 whitespace-nowrap">
                Horário
              </th>
              <th className="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-subtle min-w-[200px]">
                Paciente
              </th>
              <th className="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-subtle min-w-[160px]">
                Tipo
              </th>
              <th className="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-subtle min-w-[160px]">
                Profissional
              </th>
              <th className="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-subtle w-32 whitespace-nowrap">
                Status
              </th>
              <th className="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-subtle w-12 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {agendamentos.map((item, idx) => (
              <tr
                key={item.id}
                className="group hover:bg-accent-primary-banner/30 transition-colors animate-slide-up"
                style={{
                  animationDelay: `${Math.min(idx * 30, 500)}ms`,
                  animationFillMode: 'both',
                }}
              >
                {viewMode !== 'day' && (
                  <td className="py-4 px-6 align-top pt-5">
                    <span className="text-xs font-bold text-subtle uppercase tracking-wider">
                      {format(new Date(item.dataHora), 'dd/MMM', { locale: ptBR })}
                    </span>
                  </td>
                )}
                <td className="py-4 px-6 font-mono font-medium text-deep align-top pt-5 tracking-tight">
                  {format(new Date(item.dataHora), 'HH:mm')}
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 mt-0.5 shadow-sm border border-border">
                      <AvatarFallback>{item.expand?.paciente?.nome?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-deep flex items-center gap-2 tracking-tight">
                        {item.expand?.paciente?.nome}
                        {item.expand?.paciente?.flags?.map((f: any) => {
                          if (
                            item.expand?.tipo?.nome &&
                            f.toLowerCase() === item.expand.tipo.nome.toLowerCase()
                          ) {
                            return null
                          }
                          return (
                            <span
                              key={f}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-800 border border-yellow-200 font-bold uppercase tracking-widest"
                            >
                              {f}
                            </span>
                          )
                        })}
                      </p>
                      <p className="text-xs text-subtle mt-1 flex items-center gap-1.5">
                        {item.expand?.convenio ? (
                          item.expand.convenio.ativo === false ? (
                            <Tooltip>
                              <TooltipTrigger className="flex items-center gap-1.5 text-rose-500/70 line-through cursor-help">
                                <ShieldAlert className="w-3.5 h-3.5" /> {item.expand.convenio.nome}
                              </TooltipTrigger>
                              <TooltipContent>Este convênio foi removido</TooltipContent>
                            </Tooltip>
                          ) : (
                            <>
                              <ShieldAlert className="w-3.5 h-3.5 text-lavender-500" />{' '}
                              {item.expand.convenio.nome}
                            </>
                          )
                        ) : (
                          <>
                            <DollarSign className="w-3.5 h-3.5 text-mint" /> Particular
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6 align-top pt-5">
                  {item.expand?.tipo?.ativo === false ? (
                    <Tooltip>
                      <TooltipTrigger className="flex items-center gap-1.5 text-rose-500/70 line-through cursor-help">
                        <DynamicIcon
                          name={item.expand?.tipo?.icone}
                          className="w-4 h-4 opacity-50 grayscale"
                        />
                        <span className="text-sm font-medium">{item.expand?.tipo?.nome}</span>
                      </TooltipTrigger>
                      <TooltipContent>Este tipo de atendimento foi removido</TooltipContent>
                    </Tooltip>
                  ) : (
                    <div
                      className={cn(
                        'flex items-center gap-1.5 text-sm font-medium',
                        TYPE_TEXT_COLORS[item.expand?.tipo?.categoria || 'primary'],
                      )}
                    >
                      <DynamicIcon name={item.expand?.tipo?.icone} className="w-4 h-4 opacity-80" />
                      <span>{item.expand?.tipo?.nome}</span>
                    </div>
                  )}
                </td>
                <td className="py-4 px-6 align-top pt-5">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 border border-border">
                      {item.expand?.profissional?.foto && (
                        <AvatarImage
                          src={pb.files.getURL(
                            item.expand.profissional,
                            item.expand.profissional.foto,
                          )}
                        />
                      )}
                      <AvatarFallback>{item.expand?.profissional?.nome?.[0]}</AvatarFallback>
                    </Avatar>
                    <span
                      className={cn(
                        'text-sm font-medium transition-colors',
                        item.expand?.profissional?.ativo === false
                          ? 'text-rose-500/70 line-through'
                          : 'text-subtle group-hover:text-deep',
                      )}
                    >
                      {item.expand?.profissional?.nome?.split(' ')[0]}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-6 align-top pt-5">
                  <div
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border',
                      STATUS_COLORS[item.status] || STATUS_COLORS.aguardando,
                    )}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-current" />
                    {item.status}
                  </div>
                </td>
                <td className="py-4 px-6 align-top pt-5 text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-background rounded-md text-subtle transition-all border border-transparent hover:border-border">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditAppointment(item)}>
                        <Pencil className="mr-2 h-4 w-4" /> Editar / Remarcar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-subtle">
                        Status
                      </DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => updateAgendamentoStatus(item.id, 'aguardando')}
                      >
                        Aguardando
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => updateAgendamentoStatus(item.id, 'confirmado')}
                      >
                        Confirmado
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => updateAgendamentoStatus(item.id, 'realizado')}
                      >
                        Realizado
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => updateAgendamentoStatus(item.id, 'faltou')}
                        className="text-rose-600 focus:bg-rose-50 focus:text-rose-700"
                      >
                        Faltou
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => updateAgendamentoStatus(item.id, 'cancelado')}
                        className="text-rose-600 focus:bg-rose-50 focus:text-rose-700"
                      >
                        Cancelado
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
