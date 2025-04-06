// src/controllers/plan.controller.js
import { PLAN_LIMITS, getUserPlanInfo, checkProductLimit, checkCategoryLimit } from '../services/plan.service.js';
import { supabase } from '../config/supabase.js';

/**
 * Retorna as informações do plano atual do usuário
 */
export const getCurrentPlan = async (req, res, next) => {
  try {
    const user = req.user;
    
    // Obter informações do plano
    const planInfo = await getUserPlanInfo(user.id);
    
    // Obter o ID da loja (se existir)
    const { data: store } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    // Se tiver loja, buscar contagens atuais
    if (store) {
      const productCount = await checkProductLimit(user.id, store.id);
      const categoryCount = await checkCategoryLimit(user.id, store.id);
      
      // Adicionar contagens à resposta
      planInfo.usage = {
        products: {
          current: productCount.currentCount,
          limit: productCount.limit,
          percentage: productCount.limit === Infinity 
            ? 0 
            : Math.round((productCount.currentCount / productCount.limit) * 100)
        },
        categories: {
          current: categoryCount.currentCount,
          limit: categoryCount.limit,
          percentage: categoryCount.limit === Infinity 
            ? 0 
            : Math.round((categoryCount.currentCount / categoryCount.limit) * 100)
        }
      };
    }
    
    res.status(200).json({
      plan: planInfo
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Retorna informações de todos os planos disponíveis
 */
export const getAllPlans = async (req, res, next) => {
  try {
    const user = req.user;
    
    // Obter plano atual do usuário
    const { data, error } = await supabase
      .from('users')
      .select('plan_active')
      .eq('id', user.id)
      .single();
    
    if (error) throw new Error('Erro ao verificar plano do usuário');
    
    const currentPlan = data.plan_active || 'free';
    
    // Formatar informações dos planos
    const plans = Object.entries(PLAN_LIMITS).map(([planId, planData]) => {
      return {
        id: planId,
        name: planData.description,
        limits: {
          maxProducts: planData.maxProducts === Infinity ? 'Ilimitado' : planData.maxProducts,
          maxCategories: planData.maxCategories === Infinity ? 'Ilimitado' : planData.maxCategories
        },
        features: planData.features,
        isCurrent: planId === currentPlan
      };
    });
    
    res.status(200).json({
      plans,
      currentPlan
    });
  } catch (err) {
    next(err);
  }
};