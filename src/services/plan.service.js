// Arquivo: src/services/plan.service.js
// Este arquivo contém a lógica de gerenciamento de planos e suas limitações no sistema

/*
PLAN_LIMITS: Objeto que define as características e limitações de cada plano
- Cada plano possui:
  * maxProducts: Número máximo de produtos permitidos
  * maxCategories: Número máximo de categorias permitidas
  * features: Array com as funcionalidades disponíveis
  * description: Descrição em português do plano

Planos disponíveis:
1. free/plan-free: Plano básico gratuito
   - 10 produtos
   - 3 categorias
   - Funcionalidades: loja básica e integração WhatsApp

2. plan-vitrine: Plano intermediário inicial
   - 20 produtos
   - 5 categorias
   - Adiciona: link personalizado, suporte básico, tema básico personalizado

3. plan-prateleira: Plano intermediário avançado
   - 50 produtos
   - 10 categorias
   - Adiciona: suporte premium, relatórios básicos, integração de pagamento,
     tema avançado, cupons e promoções

4. plan-mercado: Plano mais completo
   - Produtos ilimitados
   - Categorias ilimitadas
   - Acesso a todas as funcionalidades
*/

/*
Principais funções do serviço:

1. getUserPlanLimits(userId)
   - Verifica o plano atual do usuário no banco
   - Valida se o plano está expirado
   - Reverte para plano gratuito se necessário
   - Retorna os limites do plano atual

2. checkProductLimit(userId, storeId)
   - Verifica se o usuário pode criar mais produtos
   - Compara quantidade atual com o limite do plano
   - Retorna informações sobre o limite e possibilidade de criação

3. checkCategoryLimit(userId, storeId)
   - Similar ao checkProductLimit, mas para categorias
   - Verifica limites de criação de categorias do plano

4. hasFeatureAccess(userId, feature)
   - Verifica se o usuário tem acesso a uma funcionalidade específica
   - Considera planos com acesso total ('all') ou feature específica

5. getUserPlanInfo(userId)
   - Retorna informações detalhadas sobre o plano do usuário
   - Inclui status de ativação, dias restantes
   - Fornece limites e funcionalidades disponíveis

6. getPlanNameFromLimits(planLimits)
   - Função auxiliar interna
   - Identifica o nome do plano baseado nos limites configurados
*/

/*
Observações importantes:
1. O sistema possui tratamento de erros robusto com try/catch
2. Logs de erro são mantidos para debugging
3. Existe verificação automática de expiração de planos
4. Sistema fallback para plano gratuito em caso de erros
5. Integração com Supabase para persistência dos dados
*/


import { supabase } from "../config/supabase.js";

export const PLAN_LIMITS = {
  'free': {
    maxProducts: 10,
    maxCategories: 3,
    features: ['basic_store', 'whatsapp_integration'],
    description: 'Plano Gratuito'
  },
  'plan-free': {
    maxProducts: 10,
    maxCategories: 3,
    features: ['basic_store', 'whatsapp_integration'],
    description: 'Plano Gratuito'
  },
  'plan-vitrine': {
    maxProducts: 20,
    maxCategories: 5,
    features: ['basic_store', 'whatsapp_integration', 'custom_link', 'basic_support', 'custom_theme_basic'],
    description: 'Plano Vitrine'
  },
  'plan-prateleira': {
    maxProducts: 50,
    maxCategories: 10,
    features: [
      'basic_store', 
      'whatsapp_integration', 
      'custom_link', 
      'premium_support', 
      'basic_reports', 
      'payment_integration', 
      'custom_theme_advanced',
      'coupons', 
      'promotions'
    ],
    description: 'Plano Prateleira'
  },
  'plan-mercado': {
    maxProducts: Infinity,
    maxCategories: Infinity,
    features: ['all'],
    description: 'Plano Mercado'
  }
};

/**
 * Obtém os limites do plano atual do usuário
 * @param {string} userId - ID do usuário
 * @returns {Object} Objeto com os limites do plano
 */
export async function getUserPlanLimits(userId) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('plan_active, plan_expire_at')
      .eq('id', userId)
      .single();
    
    if (error) throw new Error('Erro ao verificar plano do usuário');
    

    if (data.plan_active && data.plan_active !== 'plan-free' && data.plan_expire_at) {
      const now = new Date();
      const expireDate = new Date(data.plan_expire_at);
      
      if (now > expireDate) {

        await supabase
          .from('users')
          .update({ 
            plan_active: 'plan-free',
            plan_expire_at: null
          })
          .eq('id', userId);
        
        console.log(`Plano do usuário ${userId} expirou e foi revertido para gratuito`);
        return PLAN_LIMITS['plan-free'];
      }
    }
    
    const planName = data.plan_active || 'plan-free';
    return PLAN_LIMITS[planName] || PLAN_LIMITS['plan-free'];
  } catch (err) {
    console.error('Erro ao obter limites do plano:', err);
    return PLAN_LIMITS['plan-free'];
  }
}

/**
 * Verifica se o usuário pode criar mais produtos
 * @param {string} userId - ID do usuário
 * @param {string} storeId - ID da loja
 * @returns {Object} Objeto com informações sobre o limite
 */
export async function checkProductLimit(userId, storeId) {
  try {
    const planLimits = await getUserPlanLimits(userId);
  

    const { count, error } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId);
    
    if (error) throw new Error('Erro ao contar produtos');
    
    return {
      currentCount: count,
      limit: planLimits.maxProducts,
      canCreate: count < planLimits.maxProducts,
      planName: getPlanNameFromLimits(planLimits)
    };
  } catch (err) {
    console.error('Erro ao verificar limite de produtos:', err);
    throw err;
  }
}

/**
 * Verifica se o usuário pode criar mais categorias
 * @param {string} userId - ID do usuário
 * @param {string} storeId - ID da loja
 * @returns {Object} Objeto com informações sobre o limite
 */
export async function checkCategoryLimit(userId, storeId) {
  try {
    const planLimits = await getUserPlanLimits(userId);
    
    const { count, error } = await supabase
      .from('product_categories')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId);
    
    if (error) throw new Error('Erro ao contar categorias');
    
    return {
      currentCount: count,
      limit: planLimits.maxCategories,
      canCreate: count < planLimits.maxCategories,
      planName: getPlanNameFromLimits(planLimits)
    };
  } catch (err) {
    console.error('Erro ao verificar limite de categorias:', err);
    throw err;
  }
}

/**
 * Verifica se o usuário tem acesso a uma determinada funcionalidade
 * @param {string} userId - ID do usuário
 * @param {string} feature - Nome da funcionalidade
 * @returns {Promise<boolean>} true se tiver acesso, false caso contrário
 */
export async function hasFeatureAccess(userId, feature) {
  try {
    const planLimits = await getUserPlanLimits(userId);
    return planLimits.features.includes('all') || planLimits.features.includes(feature);
  } catch (err) {
    console.error('Erro ao verificar acesso à funcionalidade:', err);
    return false;
  }
}

/**
 * Obtém informações do plano atual do usuário
 * @param {string} userId - ID do usuário
 * @returns {Promise<Object>} Informações do plano
 */
export async function getUserPlanInfo(userId) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('plan_active, plan_expire_at')
      .eq('id', userId)
      .single();
    
    if (error) throw new Error('Erro ao obter informações do plano');
    
    const planName = data.plan_active || 'plan-free';
    const planLimits = PLAN_LIMITS[planName] || PLAN_LIMITS['plan-free'];
    
    let status = 'active';
    let daysRemaining = null;
    
    if (planName !== 'plan-free' && data.plan_expire_at) {
      const now = new Date();
      const expireDate = new Date(data.plan_expire_at);
      
      if (now > expireDate) {
        status = 'expired';
      } else {
        status = 'active';
        const diffTime = Math.abs(expireDate - now);
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
    }
    
    return {
      planName,
      description: planLimits.description,
      status,
      expiresAt: data.plan_expire_at,
      daysRemaining,
      limits: {
        maxProducts: planLimits.maxProducts,
        maxCategories: planLimits.maxCategories
      },
      features: planLimits.features
    };
  } catch (err) {
    console.error('Erro ao obter informações do plano:', err);
    throw err;
  }
}

/**
 * Função auxiliar para obter o nome do plano a partir dos limites
 * @param {Object} planLimits - Objeto com os limites do plano
 * @returns {string} Nome do plano
 */
function getPlanNameFromLimits(planLimits) {
  for (const [planName, limits] of Object.entries(PLAN_LIMITS)) {
    if (planLimits === limits) {
      return planName;
    }
  }
  return 'plan-free';
}