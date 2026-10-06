import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Stethoscope, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import bgImage from '../assets/login-bg-fullscreen-16x9-v3-cluster-2k-9fbe9.png'

export default function Login() {
  const navigate = useNavigate()
  const { signIn, signUp, enterDemo } = useAuth()

  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [sobrenome, setSobrenome] = useState('')
  const [cargo, setCargo] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (isSignUp) {
      const { error: err } = await signUp(email, password, name, sobrenome, cargo)
      setIsLoading(false)
      if (err) {
        setError(err.message || 'Erro ao criar conta. Verifique os dados.')
      } else {
        navigate('/')
      }
    } else {
      const { error: err } = await signIn(email, password)
      setIsLoading(false)
      if (err) {
        setError('E-mail ou senha incorretos')
      } else {
        navigate('/')
      }
    }
  }

  return (
    <div
      className="min-h-screen w-full bg-cover bg-center animate-hero-bg-drift flex flex-col items-center lg:items-start justify-center p-6 sm:p-8 md:p-12 lg:px-24 relative overflow-y-auto"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="w-full max-w-lg my-auto bg-background/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 sm:p-12 relative z-10 animate-fade-in-up shrink-0">
        <header className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shadow-sm">
            <Stethoscope className="w-5 h-5 text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="font-display font-semibold text-xl text-foreground tracking-tight leading-none">
              ClínicaPro
            </h1>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-[0.2em] font-semibold">
              Sistema de gestão
            </p>
          </div>
        </header>

        <div className="mb-8">
          <h2 className="font-display text-3xl sm:text-4xl text-foreground mb-3 leading-tight tracking-tight font-normal no-underline">
            Sistema pronto para Controle de Agendamentos
          </h2>
          <p className="text-sm text-muted-foreground">
            {isSignUp
              ? 'Preencha os dados abaixo para criar sua conta e registrar sua clínica.'
              : 'Entre com suas credenciais para acessar o painel.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Nome
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={isSignUp}
                    className="h-12 bg-background border-border focus-visible:ring-primary shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="sobrenome"
                    className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Sobrenome
                  </Label>
                  <Input
                    id="sobrenome"
                    value={sobrenome}
                    onChange={(e) => setSobrenome(e.target.value)}
                    required={isSignUp}
                    className="h-12 bg-background border-border focus-visible:ring-primary shadow-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="cargo"
                  className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Cargo
                </Label>
                <Input
                  id="cargo"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  required={isSignUp}
                  placeholder="Ex: Médico, Administrador"
                  className="h-12 bg-background border-border focus-visible:ring-primary shadow-sm"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@clinica.com.br"
              className="font-mono h-12 bg-background border-border focus-visible:ring-primary shadow-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              Senha
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="font-mono h-12 bg-background border-border focus-visible:ring-primary shadow-sm tracking-widest"
              required
              minLength={8}
            />
          </div>

          {error && <p className="text-sm text-destructive font-medium">{error}</p>}

          <div className="pt-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-base shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isSignUp ? (
                'Criar Conta'
              ) : (
                'Acessar Painel'
              )}
            </Button>
          </div>
        </form>

        <div className="mt-8 text-center space-y-5">
          <p className="text-sm text-muted-foreground">
            {isSignUp ? 'Já tem uma conta?' : 'Novo por aqui?'}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
              }}
              type="button"
              className="ml-2 font-bold text-primary hover:text-primary/80 transition-colors focus:outline-none"
            >
              {isSignUp ? 'Fazer login' : 'Cadastre-se'}
            </button>
          </p>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background/95 px-2 text-muted-foreground">Ou</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              enterDemo()
              navigate('/')
            }}
            className="w-full h-12 border-primary/20 hover:bg-primary/5 font-medium text-base shadow-sm transition-all"
          >
            Testar Demo
          </Button>
        </div>
      </div>
    </div>
  )
}
