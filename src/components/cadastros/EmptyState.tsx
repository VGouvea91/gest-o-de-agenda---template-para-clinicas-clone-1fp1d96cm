import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function EmptyState({
  title,
  action,
  onClick,
}: {
  title: string
  action: string
  onClick: () => void
}) {
  return (
    <div className="p-16 flex flex-col items-center justify-center text-center bg-elevated border border-border border-dashed rounded-2xl">
      <div className="w-32 h-32 mb-6 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
        <img
          src="https://img.usecurling.com/p/200/200?q=vintage%20medical%20clipboard"
          alt="Empty"
          className="w-full h-full object-cover mix-blend-multiply opacity-50 sepia"
        />
      </div>
      <h3 className="font-display font-bold text-xl text-deep mb-2">{title}</h3>
      <p className="text-subtle max-w-sm mb-6">
        Você ainda não cadastrou nenhum item nesta categoria. Comece agora.
      </p>
      <Button
        onClick={onClick}
        className="bg-lavender-500 hover:bg-lavender-600 text-white shadow-lavender-glow"
      >
        <Plus className="w-4 h-4 mr-2" /> {action}
      </Button>
    </div>
  )
}
