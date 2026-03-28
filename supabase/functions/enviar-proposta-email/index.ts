import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Edge function to send proposal email
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS')
    return new Response('ok', { headers: corsHeaders })

  try {
    const {
      proposta_id,
      email_destinatario,
      mensagem_personalizada,
      incluir_pdf,
      incluir_link,
    } = await req.json()
    if (!proposta_id || !email_destinatario)
      throw new Error('Parâmetros incompletos')

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email_destinatario)) throw new Error('Email inválido')

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabase = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: proposta, error: propError } = await supabase
      .from('propostas')
      .select(
        '*, empresas(nome), contatos(nome), usuarios(nome, nome_consultorio, email, telefone_consultorio, logo_url)',
      )
      .eq('id', proposta_id)
      .single()

    if (propError || !proposta) throw new Error('Proposta não encontrada')

    const { data: itens } = await supabase
      .from('itens_proposta')
      .select('*')
      .eq('proposta_id', proposta_id)

    const { data: custos } = await supabase
      .from('custos_operacionais')
      .select('*')
      .eq('proposta_id', proposta_id)

    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    const token = btoa(proposta_id + Date.now().toString()).substring(0, 20)
    const trackingPixel = `${supabaseUrl}/functions/v1/rastrear-visualizacao-proposta?id=${proposta_id}&token=${token}`

    const formatCurrency = (val: number) =>
      `R$ ${Number(val).toFixed(2).replace('.', ',')}`

    let itensHtml = (itens || [])
      .map(
        (i) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${i.tipo_servico}<br/><small style="color: #666;">${i.descricao || ''}</small></td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${i.quantidade}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(i.valor_unitario)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(i.subtotal || i.quantidade * i.valor_unitario)}</td>
      </tr>
    `,
      )
      .join('')

    if (!itensHtml)
      itensHtml = `<tr><td colspan="4" style="padding: 10px; text-align: center; border-bottom: 1px solid #eee;">Nenhum serviço detalhado</td></tr>`

    let custosHtml = ''
    if (custos && custos.length > 0) {
      custosHtml = `
        <h3 style="margin-top: 20px; color: #2563eb; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Custos Operacionais</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
          <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
            <th style="padding: 12px 10px; text-align: left;">Tipo</th>
            <th style="padding: 12px 10px; text-align: left;">Descrição</th>
            <th style="padding: 12px 10px; text-align: right;">Valor</th>
          </tr>
          ${custos
            .map(
              (c) => `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${c.tipo}</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${c.descricao || '-'}</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(c.valor)}</td>
            </tr>
          `,
            )
            .join('')}
        </table>
      `
    }

    const consultorio = Array.isArray(proposta.usuarios)
      ? proposta.usuarios[0]
      : proposta.usuarios
    const consultorioNome =
      consultorio?.nome_consultorio || consultorio?.nome || 'Consultoria'
    const logoHtml = consultorio?.logo_url
      ? `<img src="${consultorio.logo_url}" height="40" alt="Logo" style="margin-bottom: 10px;" />`
      : ''

    const origin =
      req.headers.get('origin') || 'https://lmconsultoria.goskip.app'
    const linkUrl = `${origin}/proposals/${proposta_id}/view?token=${token}`

    let pdfHtml = ''
    if (incluir_pdf) {
      const { data: pdfData, error: pdfError } =
        await supabase.functions.invoke('gerar-pdf-proposta', {
          body: { proposta_id },
        })
      if (!pdfError && pdfData?.url) {
        pdfHtml = `<p style="text-align: center; margin-top: 10px;"><a href="${pdfData.url}" style="color: #2563eb; text-decoration: underline;">Download do PDF da Proposta</a></p>`
      }
    }

    let html = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
      <div style="background-color: #2563eb; color: #fff; padding: 30px 20px; text-align: center;">
        ${logoHtml}
        <h1 style="margin: 0; font-size: 24px;">Proposta Comercial</h1>
        <p style="margin: 10px 0 0; font-size: 14px; opacity: 0.9;">${proposta.numero_proposta || 'S/N'} • ${new Date(proposta.data_emissao).toLocaleDateString('pt-BR')}</p>
      </div>
      <div style="padding: 30px 20px;">
        <p style="font-size: 16px;">Prezado(a) <strong>${proposta.contatos?.nome || 'Cliente'}</strong>,</p>
        <p style="line-height: 1.6;">${mensagem_personalizada ? mensagem_personalizada.replace(/\n/g, '<br/>') : 'Apresentamos nossa proposta comercial para sua avaliação e consideração.'}</p>
        
        <h3 style="margin-top: 30px; color: #2563eb; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Serviços Inclusos</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
          <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
            <th style="padding: 12px 10px; text-align: left;">Descrição</th>
            <th style="padding: 12px 10px; text-align: right;">Qtd</th>
            <th style="padding: 12px 10px; text-align: right;">Valor Un.</th>
            <th style="padding: 12px 10px; text-align: right;">Subtotal</th>
          </tr>
          ${itensHtml}
        </table>

        ${custosHtml}

        <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; text-align: right; margin-top: 30px; border: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 14px; color: #64748b;">Valor Total do Investimento</p>
          <p style="margin: 5px 0 0; font-size: 24px; font-weight: bold; color: #2563eb;">${formatCurrency(proposta.valor_total)}</p>
        </div>

        ${incluir_link ? `<div style="text-align: center; margin: 40px 0;"><a href="${linkUrl}" style="background-color: #2563eb; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Visualizar Proposta Online</a></div>` : ''}
        ${pdfHtml}

        <div style="font-size: 13px; color: #64748b; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; line-height: 1.5;">
          <p style="margin: 0 0 5px;"><strong>Condições de Pagamento:</strong> ${proposta.condicoes_pagamento || 'A combinar'}</p>
          <p style="margin: 0 0 15px;"><strong>Validade da Proposta:</strong> ${proposta.data_validade ? new Date(proposta.data_validade).toLocaleDateString('pt-BR') : '-'}</p>
          
          <p style="margin: 0;"><strong>${consultorioNome}</strong></p>
          <p style="margin: 0;">${consultorio?.email || ''} | ${consultorio?.telefone_consultorio || ''}</p>
        </div>
      </div>
      <img src="${trackingPixel}" width="1" height="1" alt="" style="display:none;" />
    </div>
    `

    let email_id_resend = null

    if (resendApiKey) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${consultorioNome} <onboarding@resend.dev>`,
          to: [email_destinatario],
          subject: `Proposta Comercial - ${proposta?.numero_proposta || 'S/N'}`,
          html: html,
        }),
      })
      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Erro no Resend: ${errText}`)
      }
      const data = await res.json()
      email_id_resend = data.id
    } else {
      console.warn('RESEND_API_KEY não configurada. Simulando envio...')
      email_id_resend = 'simulated_' + Date.now()
    }

    const { error: insertEmailError } = await supabase
      .from('emails_propostas')
      .insert({
        proposta_id,
        email_destinatario,
        assunto: `Proposta Comercial - ${proposta?.numero_proposta || 'S/N'}`,
        status: 'Enviado',
        email_id_resend,
      })

    if (insertEmailError)
      console.error('Erro ao registrar email_proposta', insertEmailError)

    await supabase.from('historico_propostas').insert({
      proposta_id,
      acao: 'Enviada',
      usuario_id: user.id,
    })

    await supabase
      .from('propostas')
      .update({ status: 'Enviada' })
      .eq('id', proposta_id)

    return new Response(
      JSON.stringify({
        success: true,
        email_id: email_id_resend,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
