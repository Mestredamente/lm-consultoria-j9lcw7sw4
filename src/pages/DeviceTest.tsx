import { useState, useEffect, useRef } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Video, Mic, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'

export default function DeviceTest() {
  const [camStatus, setCamStatus] = useState<
    'idle' | 'testing' | 'success' | 'error'
  >('idle')
  const [micStatus, setMicStatus] = useState<
    'idle' | 'testing' | 'success' | 'error'
  >('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const stopTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }
  }

  useEffect(() => {
    return () => stopTracks()
  }, [])

  const testDevices = async () => {
    setErrorMsg('')
    setCamStatus('testing')
    setMicStatus('testing')
    stopTracks()

    if (
      window.location.protocol !== 'https:' &&
      window.location.hostname !== 'localhost'
    ) {
      setErrorMsg('O teste requer conexão segura (HTTPS).')
      setCamStatus('error')
      setMicStatus('error')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCamStatus('success')
      setMicStatus('success')
    } catch (err: any) {
      setCamStatus('error')
      setMicStatus('error')
      if (err.name === 'NotAllowedError') {
        setErrorMsg(
          'Permissão negada. Por favor, libere acesso à câmera e microfone nas configurações do seu navegador.',
        )
      } else if (err.name === 'NotFoundError') {
        setErrorMsg(
          'Nenhum dispositivo encontrado. Conecte uma câmera e um microfone.',
        )
      } else {
        setErrorMsg('Erro inesperado ao acessar dispositivos: ' + err.message)
      }
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6 animate-in fade-in">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-black text-white flex items-center justify-center rounded-xl shadow-lg">
          <Video className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Teste de Dispositivos
          </h1>
          <p className="text-muted-foreground text-sm">
            Verifique câmera e microfone para as sessões virtuais.
          </p>
        </div>
      </div>

      <Card className="shadow-sm border-gray-100">
        <CardHeader>
          <CardTitle>Diagnóstico de Hardware</CardTitle>
          <CardDescription>
            Clique em iniciar para solicitar permissões e testar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gray-100 rounded-xl aspect-video flex items-center justify-center overflow-hidden relative border border-gray-200">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
            {camStatus !== 'success' && (
              <div className="text-gray-400 flex flex-col items-center">
                <Video className="w-12 h-12 mb-2 opacity-50" />
                <span className="font-medium">Nenhuma imagem recebida</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              className={`p-4 rounded-xl border flex items-center gap-3 ${camStatus === 'success' ? 'bg-green-50 border-green-200 text-green-700' : camStatus === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-200'}`}
            >
              <Video className="w-6 h-6 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-sm">Câmera</p>
                <p className="text-xs font-medium opacity-80">
                  {camStatus === 'success'
                    ? 'Funcionando'
                    : camStatus === 'error'
                      ? 'Falha'
                      : 'Aguardando'}
                </p>
              </div>
              {camStatus === 'success' && (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
              {camStatus === 'error' && (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
            </div>

            <div
              className={`p-4 rounded-xl border flex items-center gap-3 ${micStatus === 'success' ? 'bg-green-50 border-green-200 text-green-700' : micStatus === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-200'}`}
            >
              <Mic className="w-6 h-6 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-sm">Microfone</p>
                <p className="text-xs font-medium opacity-80">
                  {micStatus === 'success'
                    ? 'Funcionando'
                    : micStatus === 'error'
                      ? 'Falha'
                      : 'Aguardando'}
                </p>
              </div>
              {micStatus === 'success' && (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
              {micStatus === 'error' && (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
          </div>

          {errorMsg && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm font-medium flex items-start gap-3 shadow-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{errorMsg}</p>
            </div>
          )}

          <Button
            onClick={testDevices}
            className="w-full h-12 text-base shadow-lg hover:shadow-xl transition-all"
          >
            <RefreshCw
              className={`w-5 h-5 mr-2 ${camStatus === 'testing' ? 'animate-spin' : ''}`}
            />
            {camStatus === 'idle' ? 'Iniciar Teste' : 'Testar Novamente'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
