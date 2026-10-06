import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { Loader2 } from 'lucide-react'

export default function AccountSettings() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [name, setName] = useState(user?.name || '')
  const [sobrenome, setSobrenome] = useState(user?.sobrenome || '')
  const [cargo, setCargo] = useState(user?.cargo || '')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setErrors({})
    try {
      await pb.collection('users').update(user.id, {
        name,
        sobrenome,
        cargo,
      })
      toast({ title: 'Perfil atualizado com sucesso' })
    } catch (error) {
      setErrors(extractFieldErrors(error))
      toast({ title: 'Erro ao atualizar perfil', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-display text-deep">Configurações da conta</h1>
        <p className="text-subtle mt-1">Gerencie suas informações pessoais e profissionais.</p>
      </div>

      <div className="bg-elevated border border-border rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sobrenome">Sobrenome</Label>
              <Input
                id="sobrenome"
                value={sobrenome}
                onChange={(e) => setSobrenome(e.target.value)}
                placeholder="Seu sobrenome"
              />
              {errors.sobrenome && <p className="text-sm text-red-500">{errors.sobrenome}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo</Label>
              <Input
                id="cargo"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="Ex: Médico, Recepcionista"
              />
              {errors.cargo && <p className="text-sm text-red-500">{errors.cargo}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Papel da plataforma</Label>
              <Input
                id="role"
                value={user?.role || 'Usuário'}
                disabled
                className="bg-secondary text-subtle"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">E-mail de Acesso</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-secondary text-subtle max-w-md"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border mt-8">
            <Button
              type="submit"
              disabled={loading}
              className="min-w-[120px] bg-lavender-600 hover:bg-lavender-700"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar Alterações
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
