import { useState } from 'react'
import { UserRound, Wallet, Stethoscope } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CONTAINER } from '@/lib/layout'
import { useCadastros } from '@/contexts/CadastrosContext'
import ProfissionaisTab from '@/components/cadastros/ProfissionaisTab'
import ConveniosTab from '@/components/cadastros/ConveniosTab'
import TiposTab from '@/components/cadastros/TiposTab'

const TABS = [
  { id: 'profissionais', label: 'Profissionais', icon: UserRound },
  { id: 'convenios', label: 'Convênios', icon: Wallet },
  { id: 'tipos', label: 'Tipos de Atendimento', icon: Stethoscope },
]

function TabItem({ tab, isActive, onClick }: any) {
  const { profissionais, convenios, tipos } = useCadastros()
  const counts: Record<string, number> = {
    profissionais: profissionais.length,
    convenios: convenios.length,
    tipos: tipos.length,
  }
  const count = counts[tab.id] || 0

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
        isActive
          ? 'bg-accent-primary-soft text-lavender-700'
          : 'text-subtle hover:bg-secondary hover:text-deep',
      )}
    >
      <div className="flex items-center gap-3">
        <tab.icon className="w-4 h-4" />
        {tab.label}
      </div>
      <span className="font-mono text-xs opacity-70">{count}</span>
    </button>
  )
}

export default function Cadastros() {
  const [activeTab, setActiveTab] = useState('profissionais')

  return (
    <div className="flex-1 flex flex-col bg-base min-h-screen">
      <div className="pt-12 pb-8 relative overflow-hidden bg-base border-b border-border/50">
        <div className={cn(CONTAINER)}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-subtle mb-1">
            Capítulo II · Cadastros
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-deep tracking-tight mb-2">
            Configurar a casa.
          </h2>
          <p className="text-base text-subtle font-medium">
            Gerencie profissionais, convênios e tipos de atendimento.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className={cn(CONTAINER, 'grid grid-cols-1 md:grid-cols-12 gap-6 pt-6 pb-20')}>
          <div className="md:col-span-4">
            <div className="bg-elevated border border-border rounded-xl shadow-sm p-4 sticky top-24">
              <nav className="space-y-1">
                {TABS.map((tab) => (
                  <TabItem
                    key={tab.id}
                    tab={tab}
                    isActive={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                  />
                ))}
              </nav>
            </div>
          </div>
          <div className="md:col-span-8">
            <div className="bg-elevated border border-border rounded-xl shadow-sm p-4 md:p-6 min-h-[500px]">
              {activeTab === 'profissionais' && <ProfissionaisTab />}
              {activeTab === 'convenios' && <ConveniosTab />}
              {activeTab === 'tipos' && <TiposTab />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
