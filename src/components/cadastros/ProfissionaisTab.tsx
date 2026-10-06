import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, Upload, Loader2 } from 'lucide-react'
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
import { useCadastros, Profissional } from '@/contexts/CadastrosContext'
import { saveProfissional } from '@/services/cadastros'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import pb from '@/lib/pocketbase/client'

function AvatarUploadable({ profissional }: { profissional: Profissional }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    try {
      const payload = new FormData()
      payload.append('foto', file)
      await saveProfissional(profissional.id, payload)
      toast({ title: 'Foto atualizada com sucesso.' })
    } catch (err) {
      toast({ title: 'Erro ao atualizar foto', variant: 'destructive' })
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const fotoUrl = profissional.foto
    ? pb.files.getURL(profissional as any, profissional.foto, { thumb: '100x100' })
    : ''

  return (
    <div
      className="relative group cursor-pointer rounded-full overflow-hidden shrink-0"
      onClick={() => inputRef.current?.click()}
    >
      <Avatar className="h-12 w-12 border border-border">
        {fotoUrl ? (
          <AvatarImage src={fotoUrl} className="object-cover" />
        ) : (
          <AvatarImage
            src={`https://img.usecurling.com/ppl/thumbnail?seed=${profissional.id}`}
            className="object-cover opacity-40 grayscale"
          />
        )}
        <AvatarFallback>{profissional.nome?.[0] || '?'}</AvatarFallback>
      </Avatar>

      <div
        className={cn(
          'absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity',
          loading && 'opacity-100',
        )}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 text-white animate-spin" />
        ) : (
          <Upload className="w-4 h-4 text-white" />
        )}
      </div>

      <input
        type="file"
        ref={inputRef}
        className="hidden"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
      />
    </div>
  )
}

function ProfissionalSheet({ open, onOpenChange, initialData }: any) {
  const { toast } = useToast()
  const [formData, setFormData] = useState<Partial<Profissional>>({
    nome: '',
    especialidade: '',
    registro: '',
    duracaoConsultaMin: 30,
    ativo: true,
  })
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setFormData(
        initialData || {
          nome: '',
          especialidade: '',
          registro: '',
          duracaoConsultaMin: 30,
          ativo: true,
        },
      )
      setFotoFile(null)
    }
  }, [open, initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = new FormData()
      if (fotoFile) payload.append('foto', fotoFile)
      payload.append('nome', formData.nome || '')
      payload.append('especialidade', formData.especialidade || '')
      payload.append('registro', formData.registro || '')
      payload.append('duracaoConsultaMin', String(formData.duracaoConsultaMin || 30))
      payload.append('ativo', String(formData.ativo))

      await saveProfissional(initialData?.id || null, payload)
      toast({ title: 'Profissional salvo com sucesso.' })
      onOpenChange(false)
    } catch (err) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    }
  }

  const fotoUrl =
    formData.id && formData.foto
      ? pb.files.getURL(formData as any, formData.foto, { thumb: '100x100' })
      : ''

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-elevated border-border overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>{initialData ? 'Editar Profissional' : 'Novo Profissional'}</SheetTitle>
          <SheetDescription>Preencha os dados do profissional abaixo.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div
                className="relative group cursor-pointer rounded-full overflow-hidden shrink-0"
                onClick={() => fileInputRef.current?.click()}
              >
                <Avatar className="h-16 w-16 border border-border">
                  {fotoFile ? (
                    <AvatarImage src={URL.createObjectURL(fotoFile)} className="object-cover" />
                  ) : fotoUrl ? (
                    <AvatarImage src={fotoUrl} className="object-cover" />
                  ) : (
                    <AvatarImage
                      src={`https://img.usecurling.com/ppl/thumbnail?seed=${formData.id || 'new'}`}
                      className="object-cover opacity-40 grayscale"
                    />
                  )}
                  <AvatarFallback>{formData.nome?.[0] || '?'}</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload className="w-5 h-5 text-white" />
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setFotoFile(e.target.files[0])
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Trocar foto
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Especialidade</Label>
              <Select
                value={formData.especialidade}
                onValueChange={(v) => setFormData({ ...formData, especialidade: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    'Clínico Geral',
                    'Dentista',
                    'Fisioterapeuta',
                    'Pediatra',
                    'Cardiologista',
                    'Dermatologista',
                    'Psicólogo',
                    'Nutricionista',
                  ].map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Registro (CRM/CRO/etc)</Label>
              <Input
                required
                className="font-mono"
                value={formData.registro}
                onChange={(e) => setFormData({ ...formData, registro: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Duração Padrão (min)</Label>
              <div className="flex gap-2">
                {[15, 30, 45, 60].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setFormData({ ...formData, duracaoConsultaMin: d })}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                      formData.duracaoConsultaMin === d
                        ? 'bg-lavender-100 border-lavender-500 text-lavender-900'
                        : 'bg-background border-border text-subtle',
                    )}
                  >
                    {d} min
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div className="space-y-0.5">
                <Label>Profissional Ativo</Label>
                <p className="text-xs text-subtle">Permite novos agendamentos</p>
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

export default function ProfissionaisTab() {
  const { profissionais } = useCadastros()
  const [editing, setEditing] = useState<Profissional | null>(null)
  const [isSheetOpen, setSheetOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Profissional | null>(null)

  const handleDelete = async () => {
    if (itemToDelete) {
      await saveProfissional(itemToDelete.id, { ativo: false })
      setItemToDelete(null)
    }
  }

  const handleCreate = () => {
    setEditing(null)
    setSheetOpen(true)
  }
  const handleEdit = (p: Profissional) => {
    setEditing(p)
    setSheetOpen(true)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl font-bold text-deep">Profissionais</h3>
          <p className="text-sm text-subtle">Gerencie os profissionais de saúde da clínica.</p>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-lavender-500 hover:bg-lavender-600 text-white shadow-lavender-glow"
        >
          <Plus className="w-4 h-4 mr-2" /> Novo Profissional
        </Button>
      </div>

      {profissionais.length === 0 ? (
        <EmptyState
          title="Nenhum profissional"
          action="Cadastrar Profissional"
          onClick={handleCreate}
        />
      ) : (
        <div className="grid gap-4">
          {profissionais.map((p) => (
            <div
              key={p.id}
              className={cn(
                'flex items-center justify-between p-4 bg-elevated border border-border rounded-xl shadow-subtle transition-opacity',
                !p.ativo && 'opacity-60',
              )}
            >
              <div className="flex items-center gap-4">
                <AvatarUploadable profissional={p} />
                <div>
                  <h4 className="font-bold text-deep">{p.nome}</h4>
                  <div className="flex items-center gap-2 text-xs text-subtle mt-1">
                    <span className="px-2 py-0.5 bg-secondary rounded-md font-medium">
                      {p.especialidade}
                    </span>
                    <span className="font-mono">{p.registro}</span>
                    <span>• {p.duracaoConsultaMin}min</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-subtle">
                    {p.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                  <Switch
                    checked={p.ativo}
                    onCheckedChange={async (val) => await saveProfissional(p.id, { ativo: val })}
                  />
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}>
                  <Pencil className="w-4 h-4 text-subtle" />
                </Button>
                {p.ativo && (
                  <Button variant="ghost" size="icon" onClick={() => setItemToDelete(p)}>
                    <Trash2 className="w-4 h-4 text-rose-500" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <ProfissionalSheet open={isSheetOpen} onOpenChange={setSheetOpen} initialData={editing} />

      <AlertDialog open={!!itemToDelete} onOpenChange={(o) => !o && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Profissional</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este profissional? Os dados serão arquivados para
              preservar o histórico de agendamentos, mas o profissional não estará mais disponível
              para novos agendamentos.
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
