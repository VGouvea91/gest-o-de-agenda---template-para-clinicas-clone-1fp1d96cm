import { useEffect, useState, useCallback } from 'react'
import { Sparkles } from 'lucide-react'
import { getAgendamentosHoje } from '@/services/agendamentos'
import { useRealtime } from '@/hooks/use-realtime'
import { cn } from '@/lib/utils'
import { CONTAINER } from '@/lib/layout'

export function TopBanner() {
  const [appointmentsCount, setAppointmentsCount] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  const loadData = useCallback(async () => {
    try {
      const agendamentos = await getAgendamentosHoje()
      // Only count non-cancelled appointments as taking up capacity
      const activeCount = agendamentos.filter((a) => a.status !== 'cancelado').length
      setAppointmentsCount(activeCount)
    } catch (err) {
      console.error(err)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('agendamentos', () => {
    loadData()
  })

  // Update time every minute to keep the period accurate
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const getPeriod = () => {
    const hour = currentTime.getHours()
    if (hour >= 5 && hour < 12) return 'Manhã'
    if (hour >= 12 && hour < 18) return 'Tarde'
    return 'Noite'
  }

  const getStatus = (count: number) => {
    if (count <= 5) return 'calma'
    if (count <= 10) return 'agitada'
    return 'lotada'
  }

  if (appointmentsCount === null) {
    return (
      <div className="w-full bg-accent-primary-banner">
        <div
          className={cn(
            CONTAINER,
            'h-10 flex items-center justify-center text-sm font-medium text-deep',
          )}
        >
          <Sparkles className="w-4 h-4 mr-2 text-lavender-700 animate-pulse" />
          <span className="animate-pulse">Calculando disponibilidade...</span>
        </div>
      </div>
    )
  }

  const period = getPeriod()
  const status = getStatus(appointmentsCount)
  const freeSlots = Math.max(0, 15 - appointmentsCount)

  return (
    <div className="w-full bg-accent-primary-banner">
      <div
        className={cn(
          CONTAINER,
          'h-10 flex items-center justify-center text-sm font-medium text-deep',
        )}
      >
        <Sparkles className="w-4 h-4 mr-2 text-lavender-700" />
        {period} {status} · {freeSlots} horários ainda livres pra encaixar paciente novo.
      </div>
    </div>
  )
}
