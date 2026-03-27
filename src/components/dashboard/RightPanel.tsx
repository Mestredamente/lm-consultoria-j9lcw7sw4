import {
  Phone,
  Mail,
  Calendar,
  Linkedin,
  MessageSquare,
  Twitter,
  Edit2,
  ArrowUpRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

export function RightPanel() {
  return (
    <div className="hidden xl:flex flex-col w-80 glass-panel h-[calc(100vh-2rem)] sticky top-4 rounded-[32px] p-6 ml-4">
      <div className="flex justify-between mb-8">
        <Button variant="ghost" size="icon" className="rounded-full">
          <Edit2 className="w-4 h-4 text-gray-500" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full">
          <ArrowUpRight className="w-4 h-4 text-gray-500" />
        </Button>
      </div>

      <div className="flex flex-col items-center text-center mb-8">
        <div className="relative mb-4">
          <Avatar className="w-24 h-24 border-4 border-white shadow-xl">
            <AvatarImage src="https://img.usecurling.com/ppl/medium?gender=female&seed=1" />
            <AvatarFallback>ER</AvatarFallback>
          </Avatar>
        </div>
        <h2 className="text-xl font-bold text-gray-900">Eva Robinson</h2>
        <p className="text-sm text-gray-500">CEO, Alabama Machinery & Supply</p>

        <div className="flex gap-2 mt-6">
          <Button
            size="icon"
            className="rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 w-10 h-10"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            className="rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 w-10 h-10"
          >
            <Mail className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            className="rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 w-10 h-10"
          >
            <Phone className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Separator className="bg-gray-200 mb-6" />

      <div className="space-y-6">
        <h3 className="font-bold text-gray-800 mb-4">Informação Detalhada</h3>

        <div className="flex items-center gap-4">
          <div className="w-8 flex justify-center">
            <UsersIcon />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500">Primeiro Nome</p>
            <p className="font-medium">Eva</p>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Edit2 className="w-3 h-3 text-gray-400" />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-8 flex justify-center">
            <UsersIcon />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500">Sobrenome</p>
            <p className="font-medium">Robinson</p>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Edit2 className="w-3 h-3 text-gray-400" />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-8 flex justify-center">
            <Mail className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs text-gray-500">Email</p>
            <p className="font-medium text-sm truncate">
              evaa@alabamamachinery.com
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-8 flex justify-center">
            <Phone className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500">Telefone</p>
            <p className="font-medium text-sm">+911 120 222 313</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-8 flex justify-center">
            <div className="w-4 h-4 border border-gray-400 rounded-sm flex items-center justify-center text-[8px]">
              ⌘
            </div>
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-1">Fontes</p>
            <div className="flex gap-2">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <MessageSquare className="w-3 h-3" />
              </div>
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <Linkedin className="w-3 h-3" />
              </div>
              <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                <Twitter className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-8 flex justify-center">
            <Calendar className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500">Último Contato</p>
            <p className="font-medium text-sm">06/15/2023 at 7:16 pm</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function UsersIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-gray-400"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}
