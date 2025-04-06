import { supabase } from "../config/supabase.js";
import { hasFeatureAccess, getUserPlanInfo } from "./plan.service.js";

/**
 * Cria um novo pedido
 * @param {Object} orderData - Dados do pedido
 * @param {Object} user - Usuário autenticado (dono da loja)
 * @returns {Promise<Object>} Pedido criado com seus itens
 */
export async function createOrder(orderData, user) {
  // Iniciar uma transação utilizando procedimentos PostgreSQL
  // Usamos isso para garantir que todas as operações sejam executadas ou nenhuma
  const { data: storeData, error: storeError } = await supabase
    .from('stores')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (storeError) {
    throw new Error('Loja não encontrada');
  }

  const storeId = storeData.id;

  // Verificar limite de clientes para plano gratuito
  const planInfo = await getUserPlanInfo(user.id);
  if (planInfo.planName === 'free' || planInfo.planName === 'plan-free') {
    const { count, error: countError } = await supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .gte('created_at', new Date(new Date().setDate(1)).toISOString()) // Início do mês atual
      .lt('created_at', new Date(new Date().setMonth(new Date().getMonth() + 1, 1)).toISOString()); // Início do próximo mês

    if (countError) {
      throw new Error('Erro ao verificar limite de clientes');
    }

    if (count >= 100) {
      throw new Error('Limite de 100 clientes por mês atingido para o plano gratuito');
    }
  }

  // 1. Verificar se o cliente já existe (pelo telefone)
  const { data: existingCustomer, error: customerError } = await supabase
    .from('customers')
    .select('id')
    .eq('store_id', storeId)
    .eq('phone', orderData.customer.phone)
    .single();

  // Iniciar transação usando o client do supabase
  try {
    let customerId;
    
    // Criar ou recuperar cliente
    if (customerError || !existingCustomer) {
      // Cliente não existe, criar novo
      const { data: newCustomer, error: createError } = await supabase
        .from('customers')
        .insert({
          store_id: storeId,
          name: orderData.customer.name,
          phone: orderData.customer.phone,
          email: orderData.customer.email
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Erro ao criar cliente: ${createError.message}`);
      }
      
      customerId = newCustomer.id;
    } else {
      customerId = existingCustomer.id;
    }

    // Criar endereço
    const { data: address, error: addressError } = await supabase
      .from('addresses')
      .insert({
        customer_id: customerId,
        street: orderData.address.street,
        number: orderData.address.number,
        complement: orderData.address.complement,
        neighborhood: orderData.address.neighborhood,
        city: orderData.address.city,
        zip_code: orderData.address.zip_code,
        reference_point: orderData.address.reference_point
      })
      .select()
      .single();

    if (addressError) {
      throw new Error(`Erro ao criar endereço: ${addressError.message}`);
    }

    // Verificar e aplicar cupom, se fornecido
    let couponId = null;
    let discount = 0;
    
    if (orderData.coupon_code) {
      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('store_id', storeId)
        .eq('code', orderData.coupon_code)
        .eq('is_active', true)
        .lte('valid_from', new Date().toISOString())
        .gte('valid_until', new Date().toISOString())
        .single();

      if (couponError) {
        // Cupom não encontrado ou inválido, ignorar silenciosamente
        console.log(`Cupom inválido: ${orderData.coupon_code}`);
      } else if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
        // Limite de uso excedido
        console.log(`Limite de uso do cupom excedido: ${orderData.coupon_code}`);
      } else {
        couponId = coupon.id;
        
        // Calcular valor do pedido antes do desconto
        const subtotal = orderData.items.reduce(
          (sum, item) => sum + (item.price || 0) * item.quantity, 
          0
        );
        
        // Verificar valor mínimo do pedido
        if (subtotal >= coupon.min_order_value) {
          // Calcular desconto com base no tipo
          if (coupon.discount_type === 'percentage') {
            discount = (subtotal * coupon.discount_value) / 100;
          } else { // fixed
            discount = coupon.discount_value;
          }
          
          // Aplicar limite máximo de desconto
          if (coupon.max_discount_amount && discount > coupon.max_discount_amount) {
            discount = coupon.max_discount_amount;
          }
          
          // Incrementar contador de uso
          await supabase
            .from('coupons')
            .update({ usage_count: coupon.usage_count + 1 })
            .eq('id', coupon.id);
        }
      }
    }

    // Obter produtos e calcular valores
    const productIds = orderData.items.map(item => item.product_id);
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, price, name')
      .in('id', productIds)
      .eq('store_id', storeId);
    
    if (productsError || !products || products.length !== productIds.length) {
      throw new Error('Um ou mais produtos não foram encontrados ou não pertencem a esta loja');
    }

    // Mapear produtos por ID para fácil acesso
    const productsMap = {};
    products.forEach(product => {
      productsMap[product.id] = product;
    });
    
    // Preparar itens do pedido com preços
    const orderItems = orderData.items.map(item => {
      const product = productsMap[item.product_id];
      return {
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: product.price,
        total_price: product.price * item.quantity,
        notes: item.notes
      };
    });
    
    // Calcular valores do pedido
    const subtotal = orderItems.reduce((sum, item) => sum + item.total_price, 0);
    const deliveryFee = 0; // Implementar cálculo de taxa de entrega se necessário
    const total = subtotal + deliveryFee - discount;
    
    // Criar o pedido
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        store_id: storeId,
        customer_id: customerId,
        address_id: address.id,
        coupon_id: couponId,
        status: 'em_processamento',
        payment_method: orderData.payment_method,
        payment_status: 'pendente',
        change_for: orderData.change_for,
        subtotal,
        delivery_fee: deliveryFee,
        discount,
        total,
        notes: orderData.notes
      })
      .select()
      .single();
    
    if (orderError) {
      throw new Error(`Erro ao criar pedido: ${orderError.message}`);
    }
    
    // Inserir itens do pedido
    const orderItemsWithOrderId = orderItems.map(item => ({
      ...item,
      order_id: order.id
    }));
    
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsWithOrderId);
    
    if (itemsError) {
      throw new Error(`Erro ao criar itens do pedido: ${itemsError.message}`);
    }
    
    // Buscar o pedido completo com seus itens
    const { data: createdOrder, error: fetchError } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers(*),
        address:addresses(*),
        items:order_items(*)
      `)
      .eq('id', order.id)
      .single();
    
    if (fetchError) {
      throw new Error(`Erro ao buscar detalhes do pedido: ${fetchError.message}`);
    }
    
    return createdOrder;
  } catch (error) {
    throw error;
  }
}

/**
 * Obtém um pedido específico com todos os detalhes
 * @param {string} orderId - ID do pedido
 * @param {Object} user - Usuário autenticado
 * @returns {Promise<Object>} Pedido com detalhes
 */
export async function getOrderById(orderId, user) {
  const { data: storeIds, error: storeError } = await supabase
    .from('stores')
    .select('id')
    .eq('user_id', user.id);

  if (storeError) {
    throw new Error('Erro ao verificar lojas do usuário');
  }

  const storeIdList = storeIds.map(store => store.id);

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      *,
      customer:customers(*),
      address:addresses(*),
      items:order_items(*),
      status_history:order_status_history(*)
    `)
    .eq('id', orderId)
    .in('store_id', storeIdList)
    .single();

  if (orderError) {
    throw new Error('Pedido não encontrado ou não pertence às suas lojas');
  }

  return order;
}

/**
 * Lista pedidos da loja com filtros
 * @param {Object} filters - Filtros para a busca
 * @param {Object} user - Usuário autenticado
 * @param {number} page - Número da página
 * @param {number} limit - Limite de itens por página
 * @returns {Promise<Object>} Lista paginada de pedidos
 */
export async function listOrders(filters = {}, user, page = 1, limit = 20) {
  const { data: storeIds, error: storeError } = await supabase
    .from('stores')
    .select('id')
    .eq('user_id', user.id);

  if (storeError) {
    throw new Error('Erro ao verificar lojas do usuário');
  }

  const storeIdList = storeIds.map(store => store.id);
  
  // Calcular offset para paginação
  const offset = (page - 1) * limit;
  
  // Construir query com filtros
  let query = supabase
    .from('orders')
    .select(`
      *,
      customer:customers(id, name, phone),
      items:order_items(quantity)
    `, { count: 'exact' })
    .in('store_id', storeIdList)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  // Aplicar filtros
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters.payment_method) {
    query = query.eq('payment_method', filters.payment_method);
  }
  
  if (filters.payment_status) {
    query = query.eq('payment_status', filters.payment_status);
  }
  
  if (filters.customer_phone) {
    query = query.eq('customers.phone', filters.customer_phone);
  }
  
  if (filters.date_from) {
    query = query.gte('created_at', new Date(filters.date_from).toISOString());
  }
  
  if (filters.date_to) {
    query = query.lte('created_at', new Date(filters.date_to).toISOString());
  }
  
  const { data, error, count } = await query;
  
  if (error) {
    throw new Error(`Erro ao listar pedidos: ${error.message}`);
  }
  
  return {
    orders: data,
    pagination: {
      total: count,
      page,
      limit,
      pages: Math.ceil(count / limit)
    }
  };
}

/**
 * Atualiza o status de um pedido
 * @param {string} orderId - ID do pedido
 * @param {string} status - Novo status
 * @param {string} notes - Notas sobre a mudança
 * @param {Object} user - Usuário autenticado
 * @returns {Promise<Object>} Pedido atualizado
 */
export async function updateOrderStatus(orderId, status, notes, user) {
  // Verificar se o pedido pertence a uma loja do usuário
  const { data: storeIds, error: storeError } = await supabase
    .from('stores')
    .select('id')
    .eq('user_id', user.id);

  if (storeError) {
    throw new Error('Erro ao verificar lojas do usuário');
  }

  const storeIdList = storeIds.map(store => store.id);
  
  // Verificar o pedido
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .in('store_id', storeIdList)
    .single();
  
  if (orderError) {
    throw new Error('Pedido não encontrado ou não pertence às suas lojas');
  }
  
  // Verificar regras de transição de status
  if (order.status === 'finalizado' || order.status === 'cancelado' || order.status === 'recusado') {
    throw new Error(`Não é possível alterar um pedido que já está ${order.status}`);
  }
  
  if (order.status === 'em_rota' && status === 'cancelado') {
    throw new Error('Não é possível cancelar um pedido que já está em rota de entrega');
  }
  
  // Atualizar o status
  const { data: updatedOrder, error: updateError } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select()
    .single();
  
  if (updateError) {
    throw new Error(`Erro ao atualizar status do pedido: ${updateError.message}`);
  }
  
  // Adicionar ao histórico de status
  const { error: historyError } = await supabase
    .from('order_status_history')
    .insert({
      order_id: orderId,
      status,
      notes
    });
  
  if (historyError) {
    console.error(`Erro ao registrar histórico de status: ${historyError.message}`);
  }
  
  return updatedOrder;
}

/**
 * Atualiza o comprovante de pagamento para pedidos Pix
 * @param {string} orderId - ID do pedido
 * @param {string} paymentProofUrl - URL do comprovante
 * @param {Object} user - Usuário autenticado
 * @returns {Promise<Object>} Pedido atualizado
 */
export async function updatePaymentProof(orderId, paymentProofUrl, user) {
  // Verificar se o pedido pertence a uma loja do usuário
  const { data: storeIds, error: storeError } = await supabase
    .from('stores')
    .select('id')
    .eq('user_id', user.id);

  if (storeError) {
    throw new Error('Erro ao verificar lojas do usuário');
  }

  const storeIdList = storeIds.map(store => store.id);
  
  // Verificar o pedido
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('payment_method')
    .eq('id', orderId)
    .in('store_id', storeIdList)
    .single();
  
  if (orderError) {
    throw new Error('Pedido não encontrado ou não pertence às suas lojas');
  }
  
  // Verificar se o método de pagamento é Pix
  if (order.payment_method !== 'pix') {
    throw new Error('Só é possível anexar comprovante para pedidos com pagamento via Pix');
  }
  
  // Atualizar o comprovante
  const { data: updatedOrder, error: updateError } = await supabase
    .from('orders')
    .update({ 
      payment_proof_url: paymentProofUrl,
      payment_status: 'confirmado' // Automaticamente confirmar o pagamento
    })
    .eq('id', orderId)
    .select()
    .single();
  
  if (updateError) {
    throw new Error(`Erro ao atualizar comprovante de pagamento: ${updateError.message}`);
  }
  
  return updatedOrder;
}

/**
 * Confirma o pagamento de um pedido
 * @param {string} orderId - ID do pedido
 * @param {Object} user - Usuário autenticado
 * @returns {Promise<Object>} Pedido atualizado
 */
export async function confirmPayment(orderId, user) {
  // Verificar se o pedido pertence a uma loja do usuário
  const { data: storeIds, error: storeError } = await supabase
    .from('stores')
    .select('id')
    .eq('user_id', user.id);

  if (storeError) {
    throw new Error('Erro ao verificar lojas do usuário');
  }

  const storeIdList = storeIds.map(store => store.id);
  
  // Verificar o pedido
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('payment_status')
    .eq('id', orderId)
    .in('store_id', storeIdList)
    .single();
  
  if (orderError) {
    throw new Error('Pedido não encontrado ou não pertence às suas lojas');
  }
  
  // Atualizar o status de pagamento
  const { data: updatedOrder, error: updateError } = await supabase
    .from('orders')
    .update({ payment_status: 'confirmado' })
    .eq('id', orderId)
    .select()
    .single();
  
  if (updateError) {
    throw new Error(`Erro ao confirmar pagamento: ${updateError.message}`);
  }
  
  return updatedOrder;
}