import { useEffect, useState, useMemo } from 'react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase/client'

export function ProposalStep1({
  empId,
  setEmpId,
  contId,
  setContId,
  optId,
  setOptId,
}: {
  empId: string
  setEmpId: (v: string) => void
  contId: string
  setContId: (v: string) => void
  optId: string
  setOptId: (v: string) => void
}) {
  const [empresas, setEmpresas] = useState<any[]>([])
  const [contatos, setContatos] = useState<any[]>([])
  const [oportunidades, setOportunidades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const [empRes, contRes, optRes] = await Promise.all([
        supabase.from('empresas').select('id, nome').order('nome'),
        supabase.from('contatos').select('id, nome, empresa_id').order('nome'),
        supabase
          .from('oportunidades')
          .select('id, nome, empresa_id')
          .order('nome'),
      ])
      if (empRes.data) setEmpresas(empRes.data)
      if (contRes.data) setContatos(contRes.data)
      if (optRes.data) setOportunidades(optRes.data)
      setLoading(false)
    }
    fetchData()
  }, [])

  const filteredContatos = useMemo(
    () => contatos.filter((c) => c.empresa_id === empId),
    [contatos, empId],
  )
  const filteredOportunidades = useMemo(
    () => oportunidades.filter((o) => o.empresa_id === empId),
    [oportunidades, empId],
  )

  return (
    <div className="space-y-6 max-w-md mx-auto fade-in p-2">
      <div className="space-y-2">
        <Label>
          Empresa <span className="text-destructive">*</span>
        </Label>
        <Select
          value={empId}
          onValueChange={(v) => {
            setEmpId(v)
            setContId('')
            setOptId('')
          }}
          disabled={loading}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={
                loading ? 'Carregando...' : 'Selecione a empresa cliente'
              }
            />
          </SelectTrigger>
          <SelectContent>
            {empresas.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>
          Contato <span className="text-destructive">*</span>
        </Label>
        <Select
          value={contId}
          onValueChange={setContId}
          disabled={!empId || loading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione o contato" />
          </SelectTrigger>
          <SelectContent>
            {filteredContatos.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nome}
              </SelectItem>
            ))}
            {filteredContatos.length === 0 && empId && (
              <div className="p-2 text-sm text-muted-foreground text-center">
                Nenhum contato encontrado
              </div>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Oportunidade Comercial (Opcional)</Label>
        <Select
          value={optId}
          onValueChange={setOptId}
          disabled={!empId || loading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Vincular a uma oportunidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhuma</SelectItem>
            {filteredOportunidades.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Vincular a proposta ajuda no rastreamento de conversão do seu
          pipeline.
        </p>
      </div>
    </div>
  )
}
