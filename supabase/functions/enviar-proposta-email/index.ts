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

    const { data: proposta } = await supabase
      .from('propostas')
      .select('numero_proposta, empresas(nome), contatos(nome)')
      .eq('id', proposta_id)
      .single()

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.warn('RESEND_API_KEY não configurada. Simulando envio...')
    }

    const token = btoa(proposta_id + Date.now().toString()).substring(0, 20)
    const trackingPixel = `${supabaseUrl}/functions/v1/rastrear-visualizacao-proposta?id=${proposta_id}&token=${token}`

    let html = `<h2>Proposta Comercial: ${proposta?.numero_proposta}</h2>`
    if (mensagem_personalizada)
      html += `<p>${mensagem_personalizada.replace(/\n/g, '<br/>')}</p>`

    if (incluir_link) {
      const origin =
        req.headers.get('origin') || 'https://lmconsultoria.goskip.app'
      html += `<p><a href="${origin}/proposals/${proposta_id}/view?token=${token}" style="display:inline-block;padding:10px 20px;background:#0f172a;color:#fff;text-decoration:none;border-radius:6px;">Visualizar Proposta Online</a></p>`
    }
    html += `<img src="${trackingPixel}" width="1" height="1" alt="" />`

    if (incluir_pdf) {
      const { data: pdfData, error: pdfError } =
        await supabase.functions.invoke('gerar-pdf-proposta', {
          body: { proposta_id },
        })
      if (!pdfError && pdfData?.url) {
        html += `<p><a href="${pdfData.url}">Download do PDF da Proposta</a></p>`
      }
    }

    if (resendApiKey) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'CRM B2B <onboarding@resend.dev>',
          to: [email_destinatario],
          subject: `Proposta Comercial - ${proposta?.numero_proposta}`,
          html: html,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
    }

    await supabase.from('historico_propostas').insert({
      proposta_id,
      acao: 'Enviada',
      usuario_id: user?.id,
    })

    await supabase
      .from('propostas')
      .update({ status: 'Enviada' })
      .eq('id', proposta_id)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
