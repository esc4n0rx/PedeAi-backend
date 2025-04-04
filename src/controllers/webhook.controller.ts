import { Request, Response, RequestHandler } from 'express'
import { stripe } from '../config/stripe'
import { supabase } from '../config/supabase'

// Tipamos como um Express middleware padrão
export const handleStripeWebhook: RequestHandler = async (req, res) => {
  const sig = req.headers['stripe-signature'] as string

  let event

  try {
    const rawBody = req.body as Buffer
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    )
  } catch (err: any) {
    console.error('❌ Erro na verificação do webhook Stripe:', err.message)
    res.status(400).send(`Webhook Error: ${err.message}`)
    return
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any
    const user_id = session.metadata?.user_id
    const plano = session.metadata?.plano

    if (!user_id || !plano) {
      console.warn('⚠️ Metadata ausente no webhook')
      res.status(400).send('Metadata inválida')
      return
    }

    const expira_em = new Date()
    expira_em.setMonth(expira_em.getMonth() + 1)

    await supabase
      .from('users')
      .update({
        plan_active: `plan-${plano}`,
        plan_expire_at: expira_em.toISOString()
      })
      .eq('id', user_id)

    console.log(`✅ Plano ${plano} ativado para o usuário ${user_id}`)
  }

  res.status(200).send('Webhook recebido com sucesso.')
}
