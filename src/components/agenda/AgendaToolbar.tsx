import { format, isSameMonth, startOfWeek, endOfWeek, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ChevronLeft, ChevronRight, LayoutList, Grid } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CONTAINER } from '@/lib/layout'

interface Props {
  currentDate: Date
  setCurrentDate: (d: Date) => void
  viewMode: 'day' | 'week' | 'month'
  setViewMode: (v: 'day' | 'week' | 'month') => void
  layoutMode: 'list' | 'calendar'
  setLayoutMode: (v: 'list' | 'calendar') => void
  onPrev: () => void
  onNext: () => void
  onToday: () => void
}

export function AgendaToolbar({
  currentDate,
  setCurrentDate,
  viewMode,
  setViewMode,
  layoutMode,
  setLayoutMode,
  onPrev,
  onNext,
  onToday,
}: Props) {
  const formatDateDisplay = () => {
    if (viewMode === 'day') {
      return format(currentDate, "dd 'de' MMMM, yyyy", { locale: ptBR })
    }
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 })
      const end = endOfWeek(currentDate, { weekStartsOn: 0 })
      if (isSameMonth(start, end)) {
        return `${format(start, 'dd')} a ${format(end, "dd 'de' MMMM", { locale: ptBR })}`
      }
      return `${format(start, 'dd/MM')} a ${format(end, 'dd/MM', { locale: ptBR })}`
    }
    return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })
  }

  return (
    <div className="w-full border-b border-border bg-base sticky top-16 z-30 shadow-sm">
      <div className={cn(CONTAINER, 'h-14 flex items-center justify-between')}>
        {/* Left Controls */}
        <div className="flex items-center gap-2 md:gap-4">
          {!isToday(currentDate) && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToday}
              className="hidden md:flex font-bold uppercase text-[10px] tracking-wider h-8 border-border"
            >
              Hoje
            </Button>
          )}
          <div className="flex items-center bg-secondary/50 rounded-md p-0.5 border border-border">
            <Button variant="ghost" size="icon" onClick={onPrev} className="h-7 w-7 rounded-sm">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-7 min-w-[130px] font-bold text-xs tracking-tight text-deep hover:bg-elevated capitalize"
                >
                  {formatDateDisplay()}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={currentDate}
                  onSelect={(d) => d && setCurrentDate(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon" onClick={onNext} className="h-7 w-7 rounded-sm">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-4">
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(v) => v && setViewMode(v as any)}
            className="bg-secondary p-1 rounded-md hidden sm:flex border border-border"
          >
            <ToggleGroupItem
              value="day"
              className="h-7 px-3 text-[10px] font-bold uppercase tracking-wider data-[state=on]:bg-elevated data-[state=on]:shadow-sm data-[state=on]:text-deep text-subtle"
            >
              Dia
            </ToggleGroupItem>
            <ToggleGroupItem
              value="week"
              className="h-7 px-3 text-[10px] font-bold uppercase tracking-wider data-[state=on]:bg-elevated data-[state=on]:shadow-sm data-[state=on]:text-deep text-subtle"
            >
              Semana
            </ToggleGroupItem>
            <ToggleGroupItem
              value="month"
              className="h-7 px-3 text-[10px] font-bold uppercase tracking-wider data-[state=on]:bg-elevated data-[state=on]:shadow-sm data-[state=on]:text-deep text-subtle"
            >
              Mês
            </ToggleGroupItem>
          </ToggleGroup>
          <div className="w-px h-6 bg-border hidden md:block" />
          <ToggleGroup
            type="single"
            value={layoutMode}
            onValueChange={(v) => v && setLayoutMode(v as any)}
            className="bg-secondary p-1 rounded-md border border-border"
          >
            <ToggleGroupItem
              value="list"
              className="h-7 w-8 px-0 data-[state=on]:bg-elevated data-[state=on]:shadow-sm text-subtle data-[state=on]:text-deep"
            >
              <LayoutList className="w-3.5 h-3.5" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="calendar"
              className="h-7 w-8 px-0 data-[state=on]:bg-elevated data-[state=on]:shadow-sm text-subtle data-[state=on]:text-deep"
            >
              <Grid className="w-3.5 h-3.5" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
    </div>
  )
}
