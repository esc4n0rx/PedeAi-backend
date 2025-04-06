// src/controllers/webhook.controller.js
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

  try {
    // Processar diferentes tipos de eventos
    switch(event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
        
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
    }

    res.status(200).send('Webhook processado com sucesso.');
  } catch (err) {
    console.error('❌ Erro ao processar webhook:', err);
    // Retornar 200 para não fazer o Stripe tentar novamente, mas registrar erro
    res.status(200).send(`Webhook Error: ${err.message}`);
  }
};

/**
 * Processa o evento de checkout completado
 */
async function handleCheckoutCompleted(session) {
  const user_id = session.metadata?.user_id;
  const plano = session.metadata?.plano;

  if (!user_id || !plano) {
    console.warn('⚠️ Metadata ausente no webhook de checkout');
    return;
  }

  const expira_em = new Date();
  expira_em.setMonth(expira_em.getMonth() + 1);

  // Salvar informações da assinatura
  await supabase
    .from('users')
    .update({
      plan_active: `plan-${plano}`,
      plan_expire_at: expira_em.toISOString(),
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription
    })
    .eq('id', user_id);

  console.log(`✅ Plano ${plano} ativado para o usuário ${user_id}`);
  
  // Registrar histórico de planos
  await supabase
    .from('plan_history')
    .insert({
      user_id: user_id,
      plan_name: `plan-${plano}`,
      start_date: new Date().toISOString(),
      end_date: expira_em.toISOString(),
      payment_status: 'paid',
      amount_paid: session.amount_total / 100, // Convertendo de centavos para reais
      payment_method: session.payment_method_types[0] || 'card',
      stripe_session_id: session.id,
      stripe_subscription_id: session.subscription
    });
}

/**
 * Processa o evento de pagamento de fatura bem-sucedido
 */
async function handleInvoicePaymentSucceeded(invoice) {
  if (!invoice.subscription) {
    return; // Não é uma fatura de assinatura
  }
  
  // Buscar usuário pelo customer_id
  const { data: user, error } = await supabase
    .from('users')
    .select('id, plan_active')
    .eq('stripe_customer_id', invoice.customer)
    .single();
  
  if (error || !user) {
    console.error('❌ Usuário não encontrado para customer_id:', invoice.customer);
    return;
  }
  
  // Extrair o plano da fatura
  let plano = user.plan_active;
  
  // Se não tiver plano, tentar extrair do nome do produto
  if (!plano && invoice.lines && invoice.lines.data && invoice.lines.data.length > 0) {
    const productName = invoice.lines.data[0].description;
    if (productName.includes('Vitrine')) {
      plano = 'plan-vitrine';
    } else if (productName.includes('Prateleira')) {
      plano = 'plan-prateleira';
    } else if (productName.includes('Mercado')) {
      plano = 'plan-mercado';
    }
  }
  
  // Atualizar data de expiração
  const expira_em = new Date();
  expira_em.setMonth(expira_em.getMonth() + 1);
  
  await supabase
    .from('users')
    .update({
      plan_active: plano,
      plan_expire_at: expira_em.toISOString(),
      stripe_subscription_id: invoice.subscription
    })
    .eq('id', user.id);
  
  console.log(`✅ Renovação do ${plano} processada para o usuário ${user.id}`);
  
  // Registrar no histórico
  await supabase
    .from('plan_history')
    .insert({
      user_id: user.id,
      plan_name: plano,
      start_date: new Date().toISOString(),
      end_date: expira_em.toISOString(),
      payment_status: 'paid',
      amount_paid: invoice.amount_paid / 100,
      payment_method: invoice.payment_intent ? 'card' : 'unknown',
      stripe_invoice_id: invoice.id,
      stripe_subscription_id: invoice.subscription
    });
}

/**
 * Processa o evento de atualização de assinatura
 */
async function handleSubscriptionUpdated(subscription) {
  // Buscar usuário pela subscription_id
  const { data: user, error } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .single();
  
  if (error || !user) {
    console.warn('⚠️ Usuário não encontrado para subscription_id:', subscription.id);
    return;
  }
  
  // Se assinatura cancelada mas ainda ativa, marcar para desativar quando expirar
  if (subscription.cancel_at_period_end) {
    await supabase
      .from('users')
      .update({
        subscription_status: 'canceled_pending',
        plan_expire_at: new Date(subscription.current_period_end * 1000).toISOString()
      })
      .eq('id', user.id);
    
    console.log(`ℹ️ Assinatura marcada para cancelamento para o usuário ${user.id}`);
    return;
  }
  
  // Se status é ativo, atualizar dados da assinatura
  if (subscription.status === 'active') {
    // Determinar qual plano baseado no preço ou produto
    let plano = 'free';
    
    if (subscription.items && subscription.items.data && subscription.items.data.length > 0) {
      const priceId = subscription.items.data[0].price.id;
      
      // Mapear price IDs para planos
      const priceToPlan = {
        'price_1R95iLI5nlZeb0Ylp9ghJpVN': 'plan-vitrine',
        'price_1R95jhI5nlZeb0YlyNmLoY01': 'plan-prateleira',
        'price_1R95kuI5nlZeb0YlJmEFU2dK': 'plan-mercado'
      };
      
      plano = priceToPlan[priceId] || plano;
    }
    
    // Atualizar informações do usuário
    await supabase
      .from('users')
      .update({
        plan_active: plano,
        subscription_status: subscription.status,
        plan_expire_at: new Date(subscription.current_period_end * 1000).toISOString()
      })
      .eq('id', user.id);
    
    console.log(`✅ Assinatura atualizada para ${plano} para o usuário ${user.id}`);
  }
}

/**
 * Processa o evento de exclusão de assinatura
 */
async function handleSubscriptionDeleted(subscription) {
  // Buscar usuário pela subscription_id
  const { data: user, error } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .single();
  
  if (error || !user) {
    console.warn('⚠️ Usuário não encontrado para subscription_id:', subscription.id);
    return;
  }
  
  // Reverter para plano gratuito
  await supabase
    .from('users')
    .update({
      plan_active: 'free',
      subscription_status: 'canceled',
      plan_expire_at: null
    })
    .eq('id', user.id);
  
  console.log(`ℹ️ Assinatura cancelada para o usuário ${user.id}, revertido para plano gratuito`);
  
  // Registrar no histórico
  await supabase
    .from('plan_history')
    .insert({
      user_id: user.id,
      plan_name: 'free',
      start_date: new Date().toISOString(),
      end_date: null,
      payment_status: 'canceled',
      amount_paid: 0,
      payment_method: null,
      stripe_subscription_id: subscription.id
    });
}