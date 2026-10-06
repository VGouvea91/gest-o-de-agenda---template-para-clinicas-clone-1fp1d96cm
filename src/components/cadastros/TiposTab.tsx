import { useState, useEffect } from 'react'
import {
  Plus,
  Pencil,
  HelpCircle,
  UserPlus,
  Repeat,
  Activity,
  ClipboardCheck,
  Stethoscope,
  Heart,
  Syringe,
  FileText,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useCadastros, TipoAtendimento } from '@/contexts/CadastrosContext'
import { saveTipoAtendimento } from '@/services/cadastros'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import EmptyState from './EmptyState'

const iconMap: Record<string, any> = {
  UserPlus,
  Repeat,
  Activity,
  ClipboardCheck,
  Stethoscope,
  Heart,
  Syringe,
  FileText,
}

function RenderIcon({ name, className }: { name: string; className?: string }) {
  const Icon = iconMap[name] || HelpCircle
  return <Icon className={className} />
}

function TipoSheet({ open, onOpenChange, initialData }: any) {
  const { toast } = useToast()
  const [formData, setFormData] = useState<Partial<TipoAtendimento>>({
    nome: '',
    categoria: 'primary',
    icone: 'Stethoscope',
    duracaoMin: 30,
    precoBase: 0,
    ativo: true,
  })

  useEffect(() => {
    if (open) {
      setFormData(
        initialData || {
          nome: '',
          categoria: 'primary',
          icone: 'Stethoscope',
          duracaoMin: 30,
          precoBase: 0,
          ativo: true,
        },
      )
    }
  }, [open, initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await saveTipoAtendimento(initialData?.id || null, formData)
      toast({ title: 'Tipo salvo com sucesso.' })
      onOpenChange(false)
    } catch (err) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-elevated border-border overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>{initialData ? 'Editar Tipo' : 'Novo Tipo'}</SheetTitle>
          <SheetDescription>Configure o nome, cor e duração.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Atendimento</Label>
              <Input
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Identidade Visual</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'primary', color: 'bg-lavender-200 border-lavender-400' },
                  { id: 'mint', color: 'bg-mint/30 border-mint/50' },
                  { id: 'warm', color: 'bg-warm/40 border-warm' },
                  { id: 'info', color: 'bg-blue-100 border-blue-300' },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, categoria: c.id as any })}
                    className={cn(
                      'h-12 rounded-lg border-2 transition-all',
                      c.color,
                      formData.categoria === c.id
                        ? 'ring-2 ring-deep ring-offset-2 scale-95'
                        : 'opacity-60 hover:opacity-100',
                    )}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ícone</Label>
              <Select
                value={formData.icone}
                onValueChange={(v) => setFormData({ ...formData, icone: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(iconMap).map((ic) => (
                    <SelectItem key={ic} value={ic}>
                      <div className="flex items-center gap-2">
                        <RenderIcon name={ic} className="w-4 h-4" />
                        {ic}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duração Padrão (min)</Label>
              <div className="flex flex-wrap gap-2">
                {[15, 30, 45, 60, 90].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setFormData({ ...formData, duracaoMin: d })}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                      formData.duracaoMin === d
                        ? 'bg-lavender-100 border-lavender-500 text-lavender-900'
                        : 'bg-background border-border text-subtle',
                    )}
                  >
                    {d} min
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Preço Base (R$)</Label>
              <Input
                type="number"
                step="0.01"
                className="font-mono"
                value={formData.precoBase}
                onChange={(e) =>
                  setFormData({ ...formData, precoBase: parseFloat(e.target.value) })
                }
              />
              <p className="text-xs text-subtle mt-1">Deixe 0 para "Sob Consulta"</p>
            </div>
            <div className="flex items-center justify-between p-3 border border-border rounded-lg">
              <Label>Ativo</Label>
              <Switch
                checked={formData.ativo}
                onCheckedChange={(v) => setFormData({ ...formData, ativo: v })}
              />
            </div>
          </div>
          <div className="pt-4 border-t border-border flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-lavender-500 hover:bg-lavender-600 text-white shadow-lavender-glow"
            >
              Salvar
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

export default function TiposTab() {
  const { tipos } = useCadastros()
  const [editing, setEditing] = useState<TipoAtendimento | null>(null)
  const [isSheetOpen, setSheetOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<TipoAtendimento | null>(null)

  const handleDelete = async () => {
    if (itemToDelete) {
      await saveTipoAtendimento(itemToDelete.id, { ativo: false })
      setItemToDelete(null)
    }
  }

  const handleCreate = () => {
    setEditing(null)
    setSheetOpen(true)
  }
  const handleEdit = (t: TipoAtendimento) => {
    setEditing(t)
    setSheetOpen(true)
  }

  const colorMap: Record<string, string> = {
    warm: 'bg-warm/30 text-yellow-900 border-warm/40',
    mint: 'bg-mint/20 text-mint-900 border-mint/30',
    primary: 'bg-lavender-200 text-lavender-900 border-lavender-300',
    info: 'bg-blue-100 text-blue-900 border-blue-200',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl font-bold text-deep">Tipos de Atendimento</h3>
          <p className="text-sm text-subtle">Categorize os serviços prestados pela clínica.</p>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-lavender-500 hover:bg-lavender-600 text-white shadow-lavender-glow"
        >
          <Plus className="w-4 h-4 mr-2" /> Novo Tipo
        </Button>
      </div>

      {tipos.length === 0 ? (
        <EmptyState
          title="Nenhum tipo de atendimento"
          action="Cadastrar Tipo"
          onClick={handleCreate}
        />
      ) : (
        <div className="grid gap-4">
          {tipos.map((t) => (
            <div
              key={t.id}
              className={cn(
                'flex items-center justify-between p-4 bg-elevated border border-border rounded-xl shadow-subtle transition-opacity',
                !t.ativo && 'opacity-60',
              )}
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center border',
                    colorMap[t.categoria] || colorMap.primary,
                  )}
                >
                  <RenderIcon name={t.icone} className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-deep">{t.nome}</h4>
                  <div className="flex items-center gap-2 text-xs text-subtle mt-1">
                    <span className="font-medium">{t.duracaoMin} min</span>
                    <span className="font-mono text-[10px]">•</span>
                    <span className="font-mono">R$ {t.precoBase}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-subtle">
                    {t.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                  <Switch
                    checked={t.ativo}
                    onCheckedChange={async (val) => await saveTipoAtendimento(t.id, { ativo: val })}
                  />
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleEdit(t)}>
                  <Pencil className="w-4 h-4 text-subtle" />
                </Button>
                {t.ativo && (
                  <Button variant="ghost" size="icon" onClick={() => setItemToDelete(t)}>
                    <Trash2 className="w-4 h-4 text-rose-500" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <TipoSheet open={isSheetOpen} onOpenChange={setSheetOpen} initialData={editing} />

      <AlertDialog open={!!itemToDelete} onOpenChange={(o) => !o && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Tipo de Atendimento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este tipo de atendimento? Os dados serão arquivados
              para preservar o histórico de agendamentos, mas o tipo não estará mais disponível para
              novos agendamentos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rose-500 hover:bg-rose-600 text-white"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
