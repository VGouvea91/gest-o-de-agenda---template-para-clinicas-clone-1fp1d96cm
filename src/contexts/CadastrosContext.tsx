import React, { createContext, useContext, useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { getProfissionais, getConvenios, getTipos } from '@/services/cadastros'

export type Profissional = {
  id: string
  collectionId: string
  collectionName: string
  nome: string
  especialidade: string
  registro: string
  duracaoConsultaMin: number
  ativo: boolean
  foto?: string
}
export type Convenio = {
  id: string
  nome: string
  prazoPagamentoDias: number
  valorBaseConsulta: number
  ativo: boolean
}
export type TipoAtendimento = {
  id: string
  nome: string
  categoria: string
  icone: string
  duracaoMin: number
  precoBase: number
  ativo: boolean
}

type ContextType = {
  profissionais: Profissional[]
  convenios: Convenio[]
  tipos: TipoAtendimento[]
  isLoading: boolean
}

const CadastrosContext = createContext<ContextType | undefined>(undefined)

export function CadastrosProvider({ children }: { children: React.ReactNode }) {
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [convenios, setConvenios] = useState<Convenio[]>([])
  const [tipos, setTipos] = useState<TipoAtendimento[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  const loadAll = async () => {
    try {
      if (!user) return
      const [p, c, t] = await Promise.all([getProfissionais(), getConvenios(), getTipos()])
      setProfissionais(p as unknown as Profissional[])
      setConvenios(c as unknown as Convenio[])
      setTipos(t as unknown as TipoAtendimento[])
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [user])

  useRealtime('profissionais', () => loadAll())
  useRealtime('convenios', () => loadAll())
  useRealtime('tipos_atendimento', () => loadAll())

  return (
    <CadastrosContext.Provider value={{ profissionais, convenios, tipos, isLoading }}>
      {children}
    </CadastrosContext.Provider>
  )
}

export const useCadastros = () => {
  const ctx = useContext(CadastrosContext)
  if (!ctx) throw new Error('useCadastros must be used within CadastrosProvider')
  return ctx
}
