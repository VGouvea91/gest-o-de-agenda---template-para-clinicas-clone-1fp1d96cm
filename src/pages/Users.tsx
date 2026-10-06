import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { Loader2, Plus, Users as UsersIcon } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

export default function Users() {
  const { toast } = useToast()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [sobrenome, setSobrenome] = useState('')
  const [cargo, setCargo] = useState('')
  const [role, setRole] = useState('Profissional')
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const loadUsers = async () => {
    try {
      const records = await pb.collection('users').getFullList({
        sort: '-created',
      })
      setUsers(records)
    } catch (error) {
      console.error(error)
      toast({ title: 'Erro ao carregar usuários', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrors({})
    try {
      await pb.collection('users').create({
        email,
        password,
        passwordConfirm: password,
        name,
        sobrenome,
        cargo,
        role,
      })
      toast({ title: 'Usuário adicionado com sucesso' })
      setIsDialogOpen(false)
      loadUsers()
      setEmail('')
      setPassword('')
      setName('')
      setSobrenome('')
      setCargo('')
      setRole('Profissional')
    } catch (error) {
      setErrors(extractFieldErrors(error))
      toast({ title: 'Erro ao adicionar usuário', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading)
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-lavender-500" />
      </div>
    )

  return (
    <div className="flex-1 p-6 md:p-8 max-w-6xl mx-auto w-full animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-deep flex items-center gap-2">
            <UsersIcon className="w-6 h-6 text-lavender-500" />
            Gestão de Equipe
          </h1>
          <p className="text-subtle mt-1">Gerencie os acessos ao sistema da sua clínica.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-lavender-600 hover:bg-lavender-700 text-white shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Usuário</DialogTitle>
              <DialogDescription>
                Crie um novo acesso para um membro da sua equipe. A senha gerada deverá ser enviada
                ao usuário.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddUser} className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="add-name">Nome</Label>
                  <Input
                    id="add-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-sobrenome">Sobrenome</Label>
                  <Input
                    id="add-sobrenome"
                    value={sobrenome}
                    onChange={(e) => setSobrenome(e.target.value)}
                  />
                  {errors.sobrenome && <p className="text-xs text-red-500">{errors.sobrenome}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="add-cargo">Cargo</Label>
                  <Input
                    id="add-cargo"
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    placeholder="Ex: Médico"
                  />
                  {errors.cargo && <p className="text-xs text-red-500">{errors.cargo}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-role">Papel do Sistema</Label>
                  <select
                    id="add-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="Administrador">Administrador</option>
                    <option value="Atendimento">Atendimento</option>
                    <option value="Profissional">Profissional</option>
                  </select>
                  {errors.role && <p className="text-xs text-red-500">{errors.role}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-email">E-mail de Acesso</Label>
                <Input
                  id="add-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-pass">Senha Provisória</Label>
                <Input
                  id="add-pass"
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
                {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
              </div>
              <div className="pt-4 flex justify-end">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto bg-lavender-600 hover:bg-lavender-700"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Salvar Usuário
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-elevated border border-border rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-secondary/50">
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Papel</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-subtle">
                  Nenhum outro usuário cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id} className="hover:bg-secondary/20">
                  <TableCell className="font-medium text-deep">
                    {u.name} {u.sobrenome}
                  </TableCell>
                  <TableCell className="text-subtle">{u.email}</TableCell>
                  <TableCell className="text-subtle">{u.cargo || '-'}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        u.role === 'Administrador'
                          ? 'bg-lavender-100 text-lavender-800 border-lavender-200'
                          : u.role === 'Atendimento'
                            ? 'bg-mint/20 text-mint-800 border-mint/30'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                      }
                    >
                      {u.role || 'Usuário'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
