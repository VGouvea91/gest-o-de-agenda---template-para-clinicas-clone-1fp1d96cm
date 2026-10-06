import { useState, useEffect } from 'react'
import { Plus, Pencil, Wallet, Trash2 } from 'lucide-react'
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
import { useCadastros, Convenio } from '@/contexts/CadastrosContext'
import { saveConvenio } from '@/services/cadastros'
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
import EmptyState from './EmptyState'

function ConvenioSheet({ open, onOpenChange, initialData }: any) {
  const { toast } = useToast()
  const [formData, setFormData] = useState<Partial<Convenio>>({
    nome: '',
    prazoPagamentoDias: 30,
    valorBaseConsulta: 0,
    ativo: true,
  })

  useEffect(() => {
    if (open) {
      setFormData(
        initialData || { nome: '', prazoPagamentoDias: 30, valorBaseConsulta: 0, ativo: true },
      )
    }
  }, [open, initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await saveConvenio(initialData?.id || null, formData)
      toast({ title: 'Convênio salvo com sucesso.' })
      onOpenChange(false)
    } catch (err) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-elevated border-border overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>{initialData ? 'Editar Convênio' : 'Novo Convênio'}</SheetTitle>
          <SheetDescription>Configure as regras de repasse e valores.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome (ex: Bradesco Saúde)</Label>
              <Input
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Prazo de Pagamento (dias)</Label>
              <div className="flex gap-2">
                {[30, 45, 60, 90].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setFormData({ ...formData, prazoPagamentoDias: d })}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                      formData.prazoPagamentoDias === d
                        ? 'bg-lavender-100 border-lavender-500 text-lavender-900'
                        : 'bg-background border-border text-subtle',
                    )}
                  >
                    {d} dias
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Valor Base de Consulta (R$)</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-subtle font-mono">R$</span>
                <Input
                  required
                  type="number"
                  step="0.01"
                  className="pl-9 font-mono"
                  value={formData.valorBaseConsulta}
                  onChange={(e) =>
                    setFormData({ ...formData, valorBaseConsulta: parseFloat(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div className="space-y-0.5">
                <Label>Convênio Ativo</Label>
                <p className="text-xs text-subtle">Permite seleção na agenda</p>
              </div>
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

export default function ConveniosTab() {
  const { convenios } = useCadastros()
  const [editing, setEditing] = useState<Convenio | null>(null)
  const [isSheetOpen, setSheetOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Convenio | null>(null)

  const handleDelete = async () => {
    if (itemToDelete) {
      await saveConvenio(itemToDelete.id, { ativo: false })
      setItemToDelete(null)
    }
  }

  const handleCreate = () => {
    setEditing(null)
    setSheetOpen(true)
  }
  const handleEdit = (c: Convenio) => {
    setEditing(c)
    setSheetOpen(true)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl font-bold text-deep">Convênios</h3>
          <p className="text-sm text-subtle">Gerencie os planos de saúde aceitos.</p>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-lavender-500 hover:bg-lavender-600 text-white shadow-lavender-glow"
        >
          <Plus className="w-4 h-4 mr-2" /> Novo Convênio
        </Button>
      </div>

      {convenios.length === 0 ? (
        <EmptyState title="Nenhum convênio" action="Cadastrar Convênio" onClick={handleCreate} />
      ) : (
        <div className="grid gap-4">
          {convenios.map((c) => (
            <div
              key={c.id}
              className={cn(
                'flex items-center justify-between p-4 bg-elevated border border-border rounded-xl shadow-subtle transition-opacity',
                !c.ativo && 'opacity-60',
              )}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-lavender-50 flex items-center justify-center text-lavender-600">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-deep">{c.nome}</h4>
                  <div className="flex items-center gap-2 text-xs text-subtle mt-1">
                    <span className="px-2 py-0.5 bg-secondary rounded-md font-medium">
                      Prazo: {c.prazoPagamentoDias} dias
                    </span>
                    <span className="font-mono">Base: R$ {c.valorBaseConsulta}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-subtle">
                    {c.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                  <Switch
                    checked={c.ativo}
                    onCheckedChange={async (val) => await saveConvenio(c.id, { ativo: val })}
                  />
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}>
                  <Pencil className="w-4 h-4 text-subtle" />
                </Button>
                {c.ativo && (
                  <Button variant="ghost" size="icon" onClick={() => setItemToDelete(c)}>
                    <Trash2 className="w-4 h-4 text-rose-500" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <ConvenioSheet open={isSheetOpen} onOpenChange={setSheetOpen} initialData={editing} />

      <AlertDialog open={!!itemToDelete} onOpenChange={(o) => !o && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Convênio</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este convênio? Os dados serão arquivados para preservar
              o histórico de agendamentos, mas o convênio não estará mais disponível para novos
              agendamentos.
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
