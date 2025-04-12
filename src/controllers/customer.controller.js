// src/controllers/customer.controller.js
import { supabase } from "../config/supabase.js";
import { 
  customerIdentificationSchema, 
  customerOrderSchema 
} from "../validators/customer-order.validator.js";
import { rateLimit } from "../middlewares/rateLimiter.js";
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeData } from "../utils/sanitize.js";

// Gerar um token simples para clientes
const generateCustomerToken = (customerId, storeId) => {
  return jwt.sign(
    { id: customerId, store_id: storeId, type: 'customer' },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// Identificar cliente inicial (só nome e telefone)
export const identifyCustomer = async (req, res, next) => {
  try {
    // Aplicar limitador de taxa por IP
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 10, // 10 tentativas por janela
      message: { error: 'Muitas solicitações, tente novamente mais tarde' }
    });
    
    await new Promise((resolve) => limiter(req, res, resolve));
    
    // Validar dados
    const { storeId } = req.params;
    const customerData = customerIdentificationSchema.parse(sanitizeData(req.body));
    
    // Verificar se a loja existe e está ativa
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('id', storeId)
      .eq('status', 'active')
      .single();
    
    if (storeError || !store) {
      return res.status(404).json({ error: 'Loja não encontrada ou inativa' });
    }
    
    // Normalizar número de telefone (remover formatação)
    const normalizedPhone = customerData.phone.replace(/\D/g, '');
    
    // Verificar se o cliente já existe
    const { data: existingCustomer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('store_id', storeId)
      .eq('phone', normalizedPhone)
      .maybeSingle();
    
    let customerId;
    let isNewCustomer = false;
    
    if (!existingCustomer) {
      // Criar novo cliente
      const { data: newCustomer, error: createError } = await supabase
        .from('customers')
        .insert({
          store_id: storeId,
          name: customerData.name,
          phone: normalizedPhone,
          device_id: req.body.device_info?.device_id || null
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Erro ao criar cliente:', createError);
        return res.status(500).json({ error: 'Erro ao registrar cliente' });
      }
      
      customerId = newCustomer.id;
      isNewCustomer = true;
    } else {
      customerId = existingCustomer.id;
      
      // Atualizar nome se for diferente
      if (existingCustomer.name !== customerData.name) {
        await supabase
          .from('customers')
          .update({ name: customerData.name })
          .eq('id', customerId);
      }
    }
    
    // Gerar token para o cliente
    const token = generateCustomerToken(customerId, storeId);
    
    // Buscar endereços do cliente (se existir)
    const { data: addresses, error: addressError } = await supabase
      .from('addresses')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    
    // Buscar pedidos recentes (últimos 3)
    const { data: recentOrders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        created_at,
        status,
        total,
        items:order_items(
          product_id,
          quantity,
          unit_price
        )
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(3);
    
    res.status(200).json({
      customer: {
        id: customerId,
        name: customerData.name,
        phone: normalizedPhone,
        is_new: isNewCustomer
      },
      addresses: addresses || [],
      recent_orders: recentOrders || [],
      token
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: err.errors 
      });
    }
    next(err);
  }
};

// Criar pedido completo
export const createCustomerOrder = async (req, res, next) => {
  try {
    // Aplicar limitador de taxa por IP
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 5, // 5 pedidos por 15 minutos
      message: { error: 'Muitas solicitações, tente novamente mais tarde' }
    });
    
    await new Promise((resolve) => limiter(req, res, resolve));
    
    // Validar dados
    const { storeId } = req.params;
    const orderData = customerOrderSchema.parse(sanitizeData(req.body));
    
    // Verificar se a loja existe e está ativa
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, payment_methods')
      .eq('id', storeId)
      .eq('status', 'active')
      .single();
    
    if (storeError || !store) {
      return res.status(404).json({ error: 'Loja não encontrada ou inativa' });
    }
    
    // Verificar se o método de pagamento é aceito pela loja
    if (!store.payment_methods.includes(orderData.payment_method)) {
      return res.status(400).json({ 
        error: 'Método de pagamento não aceito por esta loja',
        accepted_methods: store.payment_methods
      });
    }
    
    // Normalizar número de telefone
    const normalizedPhone = orderData.customer.phone.replace(/\D/g, '');
    
    // Verificar se o cliente já existe
    const { data: existingCustomer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('store_id', storeId)
      .eq('phone', normalizedPhone)
      .maybeSingle();
    
    let customerId;
    
    if (!existingCustomer) {
      // Criar novo cliente
      const { data: newCustomer, error: createError } = await supabase
        .from('customers')
        .insert({
          store_id: storeId,
          name: orderData.customer.name,
          phone: normalizedPhone,
          device_id: orderData.device_info?.device_id || null
        })
        .select('id')
        .single();
      
      if (createError) {
        console.error('Erro ao criar cliente:', createError);
        return res.status(500).json({ error: 'Erro ao registrar cliente' });
      }
      
      customerId = newCustomer.id;
    } else {
      customerId = existingCustomer.id;
      
      // Atualizar nome se necessário
      await supabase
        .from('customers')
        .update({ name: orderData.customer.name })
        .eq('id', customerId);
    }
    
    // Criar ou atualizar endereço
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
      .select('id')
      .single();
    
    if (addressError) {
      console.error('Erro ao salvar endereço:', addressError);
      return res.status(500).json({ error: 'Erro ao salvar endereço' });
    }
    
    // Verificar preços dos produtos (segurança)
    const productIds = orderData.items.map(item => item.product_id);
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price, discount_price, status')
      .in('id', productIds)
      .eq('store_id', storeId);
    
    if (productsError || !products || products.length !== productIds.length) {
      return res.status(400).json({ 
        error: 'Um ou mais produtos não foram encontrados ou não pertencem a esta loja' 
      });
    }
    
    // Verificar se todos os produtos estão ativos
    const inactiveProducts = products.filter(p => p.status !== 'active');
    if (inactiveProducts.length > 0) {
      return res.status(400).json({
        error: 'Um ou mais produtos não estão disponíveis no momento',
        products: inactiveProducts.map(p => p.name)
      });
    }
    
    // Mapear produtos por ID para fácil acesso
    const productsMap = {};
    products.forEach(product => {
      productsMap[product.id] = product;
    });
    
    // Calcular valores e preparar itens do pedido
    let subtotal = 0;
    const orderItems = orderData.items.map(item => {
      const product = productsMap[item.product_id];
      const itemPrice = product.discount_price || product.price;
      const total = itemPrice * item.quantity;
      
      subtotal += total;
      
      return {
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: itemPrice,
        total_price: total,
        notes: item.notes,
        options: item.options
      };
    });
    
    // Aplicar cupom (se fornecido)
    let discount = 0;
    let couponId = null;
    
    if (orderData.coupon_code) {
      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('store_id', storeId)
        .eq('code', orderData.coupon_code)
        .eq('is_active', true)
        .gte('valid_until', new Date().toISOString())
        .single();
      
      if (!couponError && coupon) {
        couponId = coupon.id;
        
        // Calcular desconto (percentual ou fixo)
        if (coupon.discount_type === 'percentage') {
          discount = (subtotal * coupon.discount_value) / 100;
        } else {
          discount = coupon.discount_value;
        }
        
        // Respeitar o desconto máximo se definido
        if (coupon.max_discount_amount && discount > coupon.max_discount_amount) {
          discount = coupon.max_discount_amount;
        }
      }
    }
    
    // Calcular taxa de entrega (pode ser implementado lógica mais complexa)
    const deliveryFee = 0; // Por enquanto, sem taxa
    
    // Calcular total
    const total = subtotal + deliveryFee - discount;
    
    // Criar o pedido principal
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        store_id: storeId,
        customer_id: customerId,
        address_id: address.id,
        status: 'em_processamento',
        payment_method: orderData.payment_method,
        payment_status: 'pendente',
        subtotal,
        delivery_fee: deliveryFee,
        discount,
        total,
        coupon_id: couponId,
        change_for: orderData.change_for,
        notes: orderData.notes,
        origin: 'app',
        device_info: orderData.device_info
      })
      .select()
      .single();
    
    if (orderError) {
      console.error('Erro ao criar pedido:', orderError);
      return res.status(500).json({ error: 'Erro ao criar pedido' });
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
      console.error('Erro ao criar itens do pedido:', itemsError);
      // Se falhou ao criar os itens, remover o pedido para manter consistência
      await supabase.from('orders').delete().eq('id', order.id);
      return res.status(500).json({ error: 'Erro ao processar itens do pedido' });
    }
    
    // Inserir histórico de status
    await supabase
      .from('order_status_history')
      .insert({
        order_id: order.id,
        status: 'em_processamento',
        notes: 'Pedido recebido'
      });
    
    // Obter versão completa do pedido
    const { data: completeOrder, error: fetchError } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        payment_method,
        payment_status,
        subtotal,
        delivery_fee,
        discount,
        total,
        change_for,
        notes,
        created_at,
        customer:customers(id, name, phone),
        address:addresses(
          street, 
          number, 
          complement, 
          neighborhood, 
          city, 
          zip_code, 
          reference_point
        ),
        items:order_items(
          id,
          product_id,
          quantity,
          unit_price,
          total_price,
          notes,
          options
        )
      `)
      .eq('id', order.id)
      .single();
    
    // Gerar token para o cliente (se necessário)
    const token = generateCustomerToken(customerId, storeId);
    
    res.status(201).json({
      message: 'Pedido criado com sucesso',
      order: completeOrder,
      order_id: order.id,
      estimated_time: 30, // Em minutos, pode ser configurado pela loja
      token
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: err.errors 
      });
    }
    next(err);
  }
};

// Verificar status do pedido
export const getOrderStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    
    // Pode ser acessado ou pelo token ou pelo ID+telefone
    let customerId;
    
    if (req.headers.authorization) {
      // Verificar token
      const token = req.headers.authorization.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.type !== 'customer') {
          return res.status(401).json({ error: 'Token inválido' });
        }
        customerId = decoded.id;
      } catch (err) {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
      }
    } else if (req.query.phone) {
      // Verificar por telefone
      const normalizedPhone = req.query.phone.replace(/\D/g, '');
      
      const { data: customer, error } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', normalizedPhone)
        .single();
      
      if (error || !customer) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }
      
      customerId = customer.id;
    } else {
      return res.status(401).json({ error: 'Autenticação necessária' });
    }
    
    // Buscar o pedido
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        payment_method,
        payment_status,
        total,
        created_at,
        updated_at,
        status_history:order_status_history(
          status,
          notes,
          created_at
        )
      `)
      .eq('id', orderId)
      .eq('customer_id', customerId)
      .single();
    
    if (error || !order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    // Calcular tempo estimado baseado no status
    let estimatedTimeRemaining = 0;
    
    switch (order.status) {
      case 'em_processamento':
        estimatedTimeRemaining = 25; // 25 minutos
        break;
      case 'em_preparacao':
        estimatedTimeRemaining = 15; // 15 minutos
        break;
      case 'em_rota':
        estimatedTimeRemaining = 10; // 10 minutos
        break;
      default:
        estimatedTimeRemaining = 0;
    }
    
    res.status(200).json({
      order_id: order.id,
      status: order.status,
      payment_status: order.payment_status,
      estimated_time_remaining: estimatedTimeRemaining,
      history: order.status_history,
      can_cancel: ['em_processamento'].includes(order.status)
    });
  } catch (err) {
    next(err);
  }
};

// Cancelar pedido (somente em status inicial)
export const cancelOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    
    // Verificar autenticação do cliente
    let customerId;
    
    if (req.headers.authorization) {
      // Verificar token
      const token = req.headers.authorization.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.type !== 'customer') {
          return res.status(401).json({ error: 'Token inválido' });
        }
        customerId = decoded.id;
      } catch (err) {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
      }
    } else {
      return res.status(401).json({ error: 'Autenticação necessária' });
    }
    
    // Verificar pedido e status
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, status')
      .eq('id', orderId)
      .eq('customer_id', customerId)
      .single();
    
    if (error || !order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    // Verificar se o pedido pode ser cancelado
    if (order.status !== 'em_processamento') {
      return res.status(400).json({ 
        error: 'Este pedido não pode ser cancelado',
        message: 'Apenas pedidos em processamento podem ser cancelados'
      });
    }
    
    // Atualizar status
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: 'cancelado', 
        canceled_by: 'customer',
        canceled_reason: reason || 'Cancelado pelo cliente'
      })
      .eq('id', orderId);
    
    if (updateError) {
      return res.status(500).json({ error: 'Erro ao cancelar pedido' });
    }
    
    // Adicionar ao histórico
    await supabase
      .from('order_status_history')
      .insert({
        order_id: orderId,
        status: 'cancelado',
        notes: reason || 'Cancelado pelo cliente'
      });
    
    res.status(200).json({
      message: 'Pedido cancelado com sucesso',
      order_id: orderId
    });
  } catch (err) {
    next(err);
  }
};