
import { 
    getUserPlanLimits, 
    checkProductLimit, 
    checkCategoryLimit, 
    hasFeatureAccess 
  } from '../services/plan.service.js';
  import { supabase } from '../config/supabase.js';
  

  export const checkProductLimitMiddleware = async (req, res, next) => {
    try {
      const user = req.user;
      

      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (storeError || !store) {
        return res.status(404).json({ error: 'Loja não encontrada. Crie uma loja primeiro.' });
      }
      

      const limitCheck = await checkProductLimit(user.id, store.id);
      
s
      if (!limitCheck.canCreate) {
        return res.status(403).json({
          error: 'Limite de produtos atingido',
          message: `Seu plano atual (${limitCheck.planName}) permite até ${limitCheck.limit} produtos. Você já possui ${limitCheck.currentCount} produtos cadastrados.`,
          currentCount: limitCheck.currentCount,
          limit: limitCheck.limit,
          planName: limitCheck.planName,
          upgrade: true
        });
      }
      
      req.storeId = store.id;
      req.planLimits = await getUserPlanLimits(user.id);
      
      next();
    } catch (err) {
      next(err);
    }
  };
  

  export const checkCategoryLimitMiddleware = async (req, res, next) => {
    try {
      const user = req.user;
      

      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (storeError || !store) {
        return res.status(404).json({ error: 'Loja não encontrada. Crie uma loja primeiro.' });
      }
      

      const limitCheck = await checkCategoryLimit(user.id, store.id);
      

      if (!limitCheck.canCreate) {
        return res.status(403).json({
          error: 'Limite de categorias atingido',
          message: `Seu plano atual (${limitCheck.planName}) permite até ${limitCheck.limit} categorias. Você já possui ${limitCheck.currentCount} categorias cadastradas.`,
          currentCount: limitCheck.currentCount,
          limit: limitCheck.limit,
          planName: limitCheck.planName,
          upgrade: true
        });
      }
      

      req.storeId = store.id;
      req.planLimits = await getUserPlanLimits(user.id);
      
      next();
    } catch (err) {
      next(err);
    }
  };
  
  /**
   * Factory de middleware para verificar acesso a funcionalidades específicas
   * @param {string} feature - Nome da funcionalidade a ser verificada
   * @returns {Function} Middleware para verificação de acesso
   */
export const checkFeatureAccessMiddleware = (feature) => {
    return async (req, res, next) => {
      try {
        const user = req.user;
        
        const hasAccess = await hasFeatureAccess(user.id, feature);
        
        if (!hasAccess) {

          const { data, error } = await supabase
            .from('users')
            .select('plan_active')
            .eq('id', user.id)
            .single();
            
          if (error) throw new Error('Erro ao verificar plano do usuário');
          
          const planName = data.plan_active || 'plan-free';
          
          let requiredPlan = 'Plano pago';
          
          const { PLAN_LIMITS } = await import('../services/plan.service.js');
          
          for (const [plan, limits] of Object.entries(PLAN_LIMITS)) {
            if (limits.features.includes(feature) || limits.features.includes('all')) {
              requiredPlan = limits.description || plan;
              break;
            }
          }
          
          return res.status(403).json({
            error: 'Acesso negado',
            message: `Esta funcionalidade não está disponível no seu plano atual (${planName}).`,
            requiredFeature: feature,
            requiredPlan: requiredPlan,
            currentPlan: planName,
            upgrade: true
          });
        }
        
        next();
      } catch (err) {
        console.error('Erro no middleware de acesso a feature:', err);
        next(err);
      }
    };
  };