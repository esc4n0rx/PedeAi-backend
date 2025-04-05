import { stripe } from "../config/stripe.js";
import { supabase } from "../config/supabase.js";

export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    const rawBody = req.body;
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('❌ Erro na verificação do webhook Stripe:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const user_id = session.metadata?.user_id;
    const plano = session.metadata?.plano;

    if (!user_id || !plano) {
      console.warn('⚠️ Metadata ausente no webhook');
      res.status(400).send('Metadata inválida');
      return;
    }

    const expira_em = new Date();
    expira_em.setMonth(expira_em.getMonth() + 1);

    await supabase
      .from('users')
      .update({
        plan_active: `plan-${plano}`,
        plan_expire_at: expira_em.toISOString()
      })
      .eq('id', user_id);

    console.log(`✅ Plano ${plano} ativado para o usuário ${user_id}`);
  }

  res.status(200).send('Webhook recebido com sucesso.');
};