import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import { ServiceRow } from './proposal-types'

export function ProposalStep2({
  services,
  setServices,
}: {
  services: ServiceRow[]
  setServices: any
}) {
  const updateSrv = (id: string, f: keyof ServiceRow, v: any) =>
    setServices((s: ServiceRow[]) =>
      s.map((x) => (x.id === id ? { ...x, [f]: v } : x)),
    )

  const addCustom = () =>
    setServices([
      ...services,
      {
        id: Math.random().toString(),
        tipo: 'Outro Serviço',
        descricao: '',
        quantidade: 1,
        valor_unitario: 0,
        checked: true,
        isCustom: true,
      },
    ])

  return (
    <div className="space-y-4 fade-in">
      <div className="rounded-xl border border-border/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[60vh]">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead className="w-[280px]">Serviço</TableHead>
                <TableHead className="min-w-[250px]">
                  Descrição do Escopo
                </TableHead>
                <TableHead className="w-[120px]">Qtd (h/d)</TableHead>
                <TableHead className="w-[150px]">Valor Un.</TableHead>
                <TableHead className="w-[140px]">Subtotal</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((srv) => (
                <TableRow
                  key={srv.id}
                  className={
                    srv.checked
                      ? 'bg-primary/5 transition-colors'
                      : 'transition-colors hover:bg-muted/30'
                  }
                >
                  <TableCell>
                    <Checkbox
                      checked={srv.checked}
                      onCheckedChange={(c) => updateSrv(srv.id, 'checked', !!c)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {srv.isCustom ? (
                      <Input
                        value={srv.tipo}
                        onChange={(e) =>
                          updateSrv(srv.id, 'tipo', e.target.value)
                        }
                        disabled={!srv.checked}
                      />
                    ) : (
                      <span
                        className={
                          !srv.checked
                            ? 'text-muted-foreground'
                            : 'text-foreground'
                        }
                      >
                        {srv.tipo}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <textarea
                      className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                      value={srv.descricao}
                      onChange={(e) =>
                        updateSrv(srv.id, 'descricao', e.target.value)
                      }
                      disabled={!srv.checked}
                      placeholder="Detalhes do escopo..."
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="1"
                      value={srv.quantidade}
                      onChange={(e) =>
                        updateSrv(srv.id, 'quantidade', Number(e.target.value))
                      }
                      disabled={!srv.checked}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={srv.valor_unitario}
                      onChange={(e) =>
                        updateSrv(
                          srv.id,
                          'valor_unitario',
                          Number(e.target.value),
                        )
                      }
                      disabled={!srv.checked}
                    />
                  </TableCell>
                  <TableCell className="font-semibold text-primary whitespace-nowrap">
                    R$ {(srv.quantidade * srv.valor_unitario).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {srv.isCustom && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setServices((s: ServiceRow[]) =>
                            s.filter((x) => x.id !== srv.id),
                          )
                        }
                        className="hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={addCustom}
        className="shadow-sm"
      >
        <Plus className="mr-2 h-4 w-4" /> Adicionar Serviço Extra
      </Button>
    </div>
  )
}
