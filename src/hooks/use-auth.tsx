import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'
import {
  isDemoMode,
  enterDemoMode as libEnterDemo,
  exitDemoMode as libExitDemo,
} from '@/lib/demo-data'

interface AuthContextType {
  user: any
  isDemoMode: boolean
  enterDemo: () => void
  signUp: (
    email: string,
    pass: string,
    name: string,
    sobrenome: string,
    cargo: string,
  ) => Promise<{ error: any }>
  signIn: (e: string, p: string) => Promise<{ error: any }>
  signOut: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(pb.authStore.record)
  const [isDemo, setIsDemo] = useState(isDemoMode())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((_token, record) => {
      setUser(record)
    })
    setLoading(false)
    return () => {
      unsubscribe()
    }
  }, [])

  const enterDemo = () => {
    libEnterDemo()
    setIsDemo(true)
  }

  const activeUser = isDemo
    ? { id: 'demo-user', name: 'Usuário Demo', email: 'demo@clinica.com', role: 'Administrador' }
    : user

  const signUp = async (
    email: string,
    pass: string,
    name: string,
    sobrenome: string,
    cargo: string,
  ) => {
    try {
      // Role is decided server-side by the on_user_create hook: the first account
      // on a fresh clone becomes the clinic owner (Administrador); later public
      // sign-ups default to Atendimento. Staff are created via the Usuários screen.
      await pb.collection('users').create({
        email,
        password: pass,
        passwordConfirm: pass,
        name,
        sobrenome,
        cargo,
      })
      await pb.collection('users').authWithPassword(email, pass)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signIn = async (email: string, pass: string) => {
    try {
      await pb.collection('users').authWithPassword(email, pass)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signOut = () => {
    if (isDemo) {
      libExitDemo()
      setIsDemo(false)
    } else {
      pb.authStore.clear()
    }
  }

  return (
    <AuthContext.Provider
      value={{ user: activeUser, isDemoMode: isDemo, enterDemo, signUp, signIn, signOut, loading }}
    >
      {children}
    </AuthContext.Provider>
  )
}
