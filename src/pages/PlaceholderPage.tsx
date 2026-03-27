import { Construction } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

interface PlaceholderPageProps {
  title: string
  description?: string
}

export default function PlaceholderPage({
  title,
  description = 'Esta página está em construção.',
}: PlaceholderPageProps) {
  return (
    <div className="glass-card rounded-[32px] p-12 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="bg-gray-100 p-6 rounded-full mb-6">
        <Construction className="w-12 h-12 text-gray-400" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
      <p className="text-gray-500 max-w-md mb-8">{description}</p>
      <Link to="/">
        <Button className="bg-black text-white rounded-full px-8">
          Voltar ao Painel
        </Button>
      </Link>
    </div>
  )
}
