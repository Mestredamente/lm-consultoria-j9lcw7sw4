import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS')
    return new Response('ok', { headers: corsHeaders })

  try {
    const payload = await req.json()
    const { type, table, record, old_record } = payload

    if (!record || !record.usuario_id) {
      return new Response(
        JSON.stringify({ message: 'Payload inválido ou sem usuario_id' }),
        { headers: corsHeaders },
      )
    }

    let matchedGatilho = null

    if (table === 'empresas' && type === 'INSERT') {
      matchedGatilho = 'Nova Empresa Criada'
    } else if (table === 'contatos' && type === 'INSERT') {
      matchedGatilho = 'Contato Criado'
    } else if (table === 'oportunidades') {
      if (type === 'INSERT') {
        matchedGatilho = 'Oportunidade Criada'
      } else if (
        type === 'UPDATE' &&
        record.estagio === 'Ganho' &&
        old_record?.estagio !== 'Ganho'
      ) {
        matchedGatilho = 'Oportunidade Ganha'
      }
    }

    if (!matchedGatilho) {
      return new Response(
        JSON.stringify({ message: 'Nenhum gatilho correspondente' }),
        { headers: corsHeaders },
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data: fluxos } = await supabase
      .from('fluxos_automacao')
      .select('*')
      .eq('usuario_id', record.usuario_id)
      .eq('gatilho', matchedGatilho)
      .eq('ativo', true)

    if (!fluxos || fluxos.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Nenhum fluxo ativo encontrado' }),
        { headers: corsHeaders },
      )
    }

    let executados = 0

    for (const fluxo of fluxos) {
      const detalhes =
        typeof fluxo.detalhes_acao === 'string'
          ? JSON.parse(fluxo.detalhes_acao)
          : fluxo.detalhes_acao || {}

      if (fluxo.acao === 'Enviar Email') {
        let assunto = detalhes.assunto || 'Notificação Automática'
        let corpo = detalhes.corpo || 'Sua automação foi disparada.'

        const nomeAlvo = record.nome || 'Cliente'
        assunto = assunto.replace(/\[Nome\]/gi, nomeAlvo)
        corpo = corpo.replace(/\[Nome\]/gi, nomeAlvo)

        let destinatario = record.email || 'contato@cliente.com'

        if (table === 'oportunidades' && record.contato_id) {
          const { data: contato } = await supabase
            .from('contatos')
            .select('email')
            .eq('id', record.contato_id)
            .single()
          if (contato?.email) destinatario = contato.email
        }

        await supabase.from('emails_automacao').insert({
          usuario_id: record.usuario_id,
          fluxo_id: fluxo.id,
          destinatario: destinatario,
          assunto: assunto,
          corpo: corpo,
        })
        executados++
      } else if (fluxo.acao === 'Criar Tarefa') {
        const titulo = detalhes.titulo || `Tarefa automática: ${fluxo.nome}`
        const descricao =
          detalhes.descricao || `Gerado pelo fluxo: ${fluxo.nome}`

        await supabase.from('atividades').insert({
          usuario_id: record.usuario_id,
          responsavel_id: record.usuario_id,
          tipo: 'Tarefa Interna',
          titulo: titulo,
          descricao: descricao,
          status: 'Agendada',
          empresa_id:
            table === 'empresas' ? record.id : record.empresa_id || null,
          contato_id:
            table === 'contatos' ? record.id : record.contato_id || null,
          oportunidade_id: table === 'oportunidades' ? record.id : null,
        })
        executados++
      } else if (fluxo.acao === 'Atualizar Campo') {
        const campo = detalhes.campo
        const valor = detalhes.valor

        if (campo && valor !== undefined) {
          await supabase
            .from(table)
            .update({ [campo]: valor })
            .eq('id', record.id)
          executados++
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: executados }),
      { headers: corsHeaders },
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders,
    })
  }
})
