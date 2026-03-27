import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('taka@hotmail.com')
  const [password, setPassword] = useState('Taka@126110')
  const [loadingForm, setLoadingForm] = useState(false)
  const { signIn, signUp, user, loading } = useAuth()
  const { toast } = useToast()

  if (loading) return null
  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingForm(true)

    try {
      const { error } = isSignUp
        ? await signUp(email, password)
        : await signIn(email, password)

      if (error) {
        let errorMessage = error.message
        if (error.message === 'Invalid login credentials') {
          errorMessage =
            'Credenciais de login inválidas. Verifique seu e-mail e senha ou crie uma conta.'
        } else if (error.message === 'User already registered') {
          errorMessage = 'Este e-mail já está cadastrado.'
        } else if (error.message === 'Email not confirmed') {
          errorMessage =
            'E-mail não confirmado. Verifique sua caixa de entrada.'
        }

        toast({
          title: 'Erro',
          description: errorMessage,
          variant: 'destructive',
        })
      } else {
        if (isSignUp) {
          toast({
            title: 'Conta criada',
            description: 'Verifique seu email para confirmar o cadastro.',
          })
        }
      }
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoadingForm(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-md glass-card border-white/60">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {isSignUp ? 'Criar Conta' : 'Entrar no CRM'}
          </CardTitle>
          <CardDescription className="text-center">
            {isSignUp
              ? 'Preencha os dados abaixo para se cadastrar'
              : 'Insira suas credenciais para acessar'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">E-mail</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Senha</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/50"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-black text-white hover:bg-gray-800"
              disabled={loadingForm}
            >
              {loadingForm ? 'Aguarde...' : isSignUp ? 'Cadastrar' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            variant="link"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-gray-500 hover:text-black"
          >
            {isSignUp
              ? 'Já tem uma conta? Entre'
              : 'Não tem conta? Cadastre-se'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
