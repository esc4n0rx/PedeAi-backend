// src/utils/orderValidator.js
import { supabase } from "../config/supabase.js";
import { securityLogger } from "./securityLogger.js";

// Validar pedido para prevenir manipulação de preços
export const validateOrderItems = async (items, storeId) => {
  if (!items || !items.length) {
    throw new Error('Pedido sem itens');
  }
  
  // Extrair IDs de produtos
  const productIds = items.map(item => item.product_id);
  
  // Buscar produtos reais do banco
  const { data: products, error } = await supabase
    .from('products')
    .select('id, price, discount_price, status')
    .in('id', productIds)
    .eq('store_id', storeId);
  
  if (error || !products || products.length !== productIds.length) {
    throw new Error('Um ou mais produtos não encontrados ou não pertencem a esta loja');
  }
  
  // Produtos inativos ou sem estoque
  const unavailableProducts = products.filter(p => p.status !== 'active');
  if (unavailableProducts.length > 0) {
    throw new Error('Um ou mais produtos não estão disponíveis no momento');
  }
  
  // Mapear produtos por ID
  const productsMap = {};
  products.forEach(product => {
    productsMap[product.id] = product;
  });
  
  // Verificar preços e gerar itens validados
  const validatedItems = [];
  let subtotal = 0;
  
  for (const item of items) {
    const product = productsMap[item.product_id];
    
    if (!product) {
      throw new Error(`Produto ${item.product_id} não encontrado`);
    }
    
    // Usar preço com desconto se disponível
    const correctPrice = product.discount_price || product.price;
    
    // Verificar se quantidade é válida
    if (!item.quantity || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
      throw new Error(`Quantidade inválida para o produto ${item.product_id}`);
    }
    
    // Calcular preço total
    const totalPrice = correctPrice * item.quantity;
    subtotal += totalPrice;
    
    validatedItems.push({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: correctPrice,
      total_price: totalPrice,
      notes: item.notes || null,
      options: item.options || null
    });
  }
  
  return {
    items: validatedItems,
    subtotal
  };
};

// Validar cupom
export const validateCoupon = async (couponCode, storeId, subtotal) => {
  if (!couponCode) {
    return { discount: 0, couponId: null };
  }
  
  // Buscar cupom
  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('store_id', storeId)
    .eq('code', couponCode)
    .eq('is_active', true)
    .lte('valid_from', new Date().toISOString())
    .gte('valid_until', new Date().toISOString())
    .single();
  
  if (error || !coupon) {
    return { discount: 0, couponId: null, error: 'Cupom inválido ou expirado' };
  }
  
  // Verificar se o valor mínimo é atingido
  if (coupon.min_order_value && subtotal < coupon.min_order_value) {
    return { 
      discount: 0, 
      couponId: null, 
      error: `Valor mínimo não atingido. O pedido deve ser de pelo menos R$ ${coupon.min_order_value.toFixed(2)}` 
    };
  }
  
  // Verificar se atingiu o limite de uso
  if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
    return { discount: 0, couponId: null, error: 'Cupom esgotado' };
  }
  
  // Calcular desconto
  let discount = 0;
  
  if (coupon.discount_type === 'percentage') {
    discount = (subtotal * coupon.discount_value) / 100;
  } else {
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
  
  return {
    discount,
    couponId: coupon.id
  };
};