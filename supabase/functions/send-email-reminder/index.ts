import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailReminderData {
  appointment_id: string
  client_name: string
  client_email: string
  appointment_date: string
  appointment_time: string
  clinic_name?: string
  clinic_email?: string
  clinic_address?: string
  clinic_phone?: string
  hours_before: number
  email_template?: string
}

function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

function generateEmailHTML(data: EmailReminderData): string {
  const formattedDate = formatDate(data.appointment_date)
  const timeOnly = data.appointment_time.slice(0, 5)
  
  // Se houver template personalizado, usa ele
  if (data.email_template) {
    return data.email_template
      .replace(/\{client_name\}/g, data.client_name)
      .replace(/\{appointment_date\}/g, formattedDate)
      .replace(/\{appointment_time\}/g, timeOnly)
      .replace(/\{clinic_name\}/g, data.clinic_name || '')
      .replace(/\{clinic_address\}/g, data.clinic_address || '')
      .replace(/\{clinic_phone\}/g, data.clinic_phone || '')
      .replace(/\{hours_before\}/g, data.hours_before.toString())
  }

  // Template padrão
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lembrete de Consulta</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Lembrete de Consulta</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Olá <strong>${data.client_name}</strong>! 👋
              </p>
              
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Este é um lembrete de que você tem uma consulta agendada em <strong>${data.hours_before} hora(s)</strong>.
              </p>
              
              <div style="background-color: #f0fdfa; border-left: 4px solid #14b8a6; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="color: #333333; font-size: 16px; margin: 0 0 10px 0;">
                  <strong>📅 Data:</strong> ${formattedDate}
                </p>
                <p style="color: #333333; font-size: 16px; margin: 0 0 10px 0;">
                  <strong>⏰ Horário:</strong> ${timeOnly}
                </p>
                ${data.clinic_name ? `<p style="color: #333333; font-size: 16px; margin: 0 0 10px 0;"><strong>📍 Clínica:</strong> ${data.clinic_name}</p>` : ''}
                ${data.clinic_address ? `<p style="color: #333333; font-size: 16px; margin: 0;"><strong>📍 Endereço:</strong> ${data.clinic_address}</p>` : ''}
              </div>
              
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                Se precisar remarcar ou cancelar sua consulta, entre em contato conosco.
              </p>
              
              ${data.clinic_phone ? `<p style="color: #666666; font-size: 14px; margin: 10px 0 0 0;"><strong>Telefone:</strong> ${data.clinic_phone}</p>` : ''}
              ${data.clinic_email ? `<p style="color: #666666; font-size: 14px; margin: 10px 0 0 0;"><strong>Email:</strong> ${data.clinic_email}</p>` : ''}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                Este é um email automático. Por favor, não responda a esta mensagem.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

function generateEmailText(data: EmailReminderData): string {
  const formattedDate = formatDate(data.appointment_date)
  const timeOnly = data.appointment_time.slice(0, 5)
  
  let text = `Olá ${data.client_name}!\n\n`
  text += `Este é um lembrete de que você tem uma consulta agendada em ${data.hours_before} hora(s).\n\n`
  text += `📅 Data: ${formattedDate}\n`
  text += `⏰ Horário: ${timeOnly}\n`
  if (data.clinic_name) text += `📍 Clínica: ${data.clinic_name}\n`
  if (data.clinic_address) text += `📍 Endereço: ${data.clinic_address}\n`
  text += `\nSe precisar remarcar ou cancelar sua consulta, entre em contato conosco.\n`
  if (data.clinic_phone) text += `Telefone: ${data.clinic_phone}\n`
  if (data.clinic_email) text += `Email: ${data.clinic_email}\n`
  
  return text
}

/**
 * Envia email via Resend API
 */
async function sendEmailViaResend(
  to: string,
  subject: string,
  html: string,
  text: string,
  from: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Tenta ler do secret primeiro, se não encontrar usa a chave fixa
    let RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    
    console.log('🔑 RESEND_API_KEY do secret existe?', !!RESEND_API_KEY)
    
    // Se não encontrou no secret, usa a chave fixa (TEMPORÁRIO PARA TESTE)
    if (!RESEND_API_KEY) {
      console.log('⚠️ Secret não encontrado, usando chave fixa')
      RESEND_API_KEY = 're_7uMrihhx_NKMq12FcLNyN9cKG4Tx7oA7F' // Chave criada agora
    }
    
    console.log('🔑 RESEND_API_KEY final existe?', !!RESEND_API_KEY)
    console.log('🔑 RESEND_API_KEY começa com re_?', RESEND_API_KEY?.startsWith('re_'))
    console.log('🔑 RESEND_API_KEY (primeiros 10 chars):', RESEND_API_KEY?.substring(0, 10))
    
    if (!RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY não configurada')
      return { success: false, error: 'RESEND_API_KEY não configurada' }
    }
    
    if (!RESEND_API_KEY.startsWith('re_')) {
      console.error('❌ RESEND_API_KEY inválida (deve começar com re_)')
      return { success: false, error: 'RESEND_API_KEY inválida (deve começar com re_)' }
    }

    console.log('📤 Enviando requisição para Resend API...')
    console.log('📤 From:', from)
    console.log('📤 To:', to)
    console.log('📤 Subject:', subject)
    console.log('📤 RESEND_API_KEY (primeiros 15 chars):', RESEND_API_KEY?.substring(0, 15))
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
        text,
      }),
    })

    console.log('📥 Resposta do Resend - Status:', response.status)
    
    if (!response.ok) {
      const error = await response.json()
      console.error('❌ Erro do Resend:', JSON.stringify(error))
      return { success: false, error: JSON.stringify(error) }
    }
    
    const result = await response.json()
    console.log('✅ Sucesso do Resend:', JSON.stringify(result))

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro desconhecido',
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('📥 Requisição recebida:', req.method, req.url)
  console.log('🔑 Verificando variáveis de ambiente...')
  console.log('🔑 RESEND_API_KEY existe?', !!Deno.env.get('RESEND_API_KEY'))
  console.log('🔑 SUPABASE_URL existe?', !!Deno.env.get('SUPABASE_URL'))

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )

    const body = await req.json()
    console.log('📦 Body recebido:', JSON.stringify(body).substring(0, 200))
    const { reminder } = body as { reminder: EmailReminderData }

    if (!reminder || !reminder.client_email) {
      return new Response(
        JSON.stringify({ error: 'Dados de lembrete inválidos ou email ausente' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📧 Enviando lembrete por email para ${reminder.client_name}...`)

    const html = generateEmailHTML(reminder)
    const text = generateEmailText(reminder)
    const subject = `Lembrete: Consulta em ${reminder.hours_before}h - ${reminder.clinic_name || 'Clínica'}`
    
    // Email do remetente
    // IMPORTANTE: Use um domínio verificado no Resend ou o domínio padrão onboarding@resend.dev
    // Para produção, configure um domínio próprio no Resend
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev'
    const fromName = reminder.clinic_name || 'Clínica Podológica'
    const from = `${fromName} <${fromEmail}>`

    const result = await sendEmailViaResend(
      reminder.client_email,
      subject,
      html,
      text,
      from
    )

    if (result.success) {
      // Marca como enviado no banco
      await supabaseClient
        .from('appointment_email_reminders')
        .insert({
          appointment_id: reminder.appointment_id,
          hours_before: reminder.hours_before,
          sent_at: new Date().toISOString(),
        })
        .select()

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email enviado com sucesso',
          appointment_id: reminder.appointment_id,
          client: reminder.client_name,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      console.warn(`⚠️ Não foi possível enviar email: ${result.error}`)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: result.error,
          appointment_id: reminder.appointment_id
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('❌ Erro na Edge Function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

