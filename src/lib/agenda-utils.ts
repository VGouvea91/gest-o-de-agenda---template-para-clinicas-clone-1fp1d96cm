export const TYPE_COLORS: Record<string, string> = {
  mint: 'bg-mint/20 text-mint-900 border-mint/30',
  primary: 'bg-lavender-200 text-lavender-900 border-lavender-300',
  warm: 'bg-warm/30 text-yellow-900 border-warm/40',
  info: 'bg-blue-100 text-blue-900 border-blue-200',
}

export const TYPE_TEXT_COLORS: Record<string, string> = {
  mint: 'text-mint-900',
  primary: 'text-lavender-900',
  warm: 'text-yellow-900',
  info: 'text-blue-900',
}

export const STATUS_COLORS: Record<string, string> = {
  confirmado: 'text-mint-900 bg-mint/20 border-mint/30',
  aguardando: 'text-yellow-700 bg-yellow-500/20 border-yellow-500/30',
  realizado: 'text-subtle bg-secondary border-border',
  faltou: 'text-rose-900 bg-rose-100 border-rose-200',
  cancelado: 'text-subtle bg-border border-border',
}

export const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
