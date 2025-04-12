// src/controllers/store.controller.js
import { storeSchema } from '../validators/store.validator.js';
import { supabase } from '../config/supabase.js';

// Criar uma nova loja
export const createStore = async (req, res, next) => {
  try {
    const user = req.user;
    const storeData = storeSchema.parse(req.body);
    
    // Verificar se o usuário já tem uma loja
    const { data: existingStore, error: checkError } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existingStore) {
      return res.status(400).json({ error: 'Usuário já possui uma loja cadastrada' });
    }

    // Gerar e validar slug
    let slug = storeData.slug || slugify(storeData.name, { 
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });
    
    // Verificar se o slug já existe
    const { data: slugExists, error: slugError } = await supabase
      .from('stores')
      .select('id')
      .eq('slug', slug)
      .single();
    
    if (slugExists) {
      // Adicionar um sufixo numérico se o slug já existir
      const timestamp = Date.now().toString().slice(-4);
      slug = `${slug}-${timestamp}`;
    }
    
    // Criar nova loja
    const { data, error } = await supabase
      .from('stores')
      .insert({
        user_id: user.id,
        name: storeData.name,
        address: storeData.address,
        neighborhood: storeData.neighborhood,
        city: storeData.city,
        logo_url: storeData.logo_url,
        banner_url: storeData.banner_url,
        theme: storeData.theme,
        payment_methods: storeData.payment_methods,
        business_hours: storeData.business_hours || {},
        slug: slug, // Adicionar o slug
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }
    
    // Gerar URL da loja
    const storeUrl = process.env.FRONTEND_URL 
      ? `${process.env.FRONTEND_URL}/${slug}`
      : `https://pedeai.com.br/${slug}`;

    res.status(201).json({
      message: 'Loja criada com sucesso',
      store: {
        ...data,
        store_url: storeUrl
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getStoreBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    
    // Sanitizar slug
    const sanitizedSlug = slug.replace(/[^a-z0-9-]/gi, '');
    
    if (sanitizedSlug !== slug) {
      securityLogger.suspiciousActivity(req, {
        type: 'INVALID_SLUG_FORMAT',
        original: slug,
        sanitized: sanitizedSlug
      });
      slug = sanitizedSlug;
    }
    
    // Buscar loja pelo slug com cache (TTL: 5 minutos)
    // Implementar lógica de cache aqui se necessário
    
    // Buscar loja pelo slug (com campos limitados por segurança)
    const { data: store, error } = await supabase
      .from('stores')
      .select(`
        id,
        name,
        logo_url,
        banner_url,
        theme,
        payment_methods,
        business_hours,
        status
      `)
      .eq('slug', slug)
      .eq('status', 'active')  // Apenas lojas ativas
      .single();
    
    if (error || !store) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }
    
    // Aplicar rate limiter específico da loja
    const storeLimiter = storeAccessLimiter(store.id);
    await new Promise((resolve) => storeLimiter(req, res, resolve));
    
    // Buscar categorias da loja (com paginação)
    const { data: categories, error: categoriesError } = await supabase
      .from('product_categories')
      .select('id, name, description, display_order')
      .eq('store_id', store.id)
      .order('display_order', { ascending: true })
      .limit(20);
    
    if (categoriesError) {
      console.error('Erro ao buscar categorias:', categoriesError);
    }
    
    // Buscar produtos em destaque (limitado)
    const { data: featuredProducts, error: featuredError } = await supabase
      .from('products')
      .select('id, name, description, price, discount_price, image_url, status, category_id')
      .eq('store_id', store.id)
      .eq('status', 'active')
      .eq('is_featured', true)
      .limit(10);
    
    if (featuredError) {
      console.error('Erro ao buscar produtos em destaque:', featuredError);
    }
    
    // Mascarar ID interno da loja por segurança
    const publicStoreInfo = {
      name: store.name,
      logo_url: store.logo_url,
      banner_url: store.banner_url,
      theme: store.theme,
      payment_methods: store.payment_methods,
      business_hours: store.business_hours
    };
    
    res.status(200).json({
      store: publicStoreInfo,
      store_id: store.id,  // ID necessário para outras operações
      categories: categories || [],
      featured_products: featuredProducts || []
    });
  } catch (err) {
    next(err);
  }
};



export const checkSlugAvailability = async (req, res, next) => {
  try {
    const { slug } = req.params;
    
    if (!slug || slug.length < 3) {
      return res.status(400).json({ 
        error: 'Slug inválido', 
        available: false 
      });
    }
    
    // Verificar se o slug já existe
    const { data, error } = await supabase
      .from('stores')
      .select('id')
      .eq('slug', slug)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    res.status(200).json({
      slug,
      available: !data,
      suggestion: data ? `${slug}-${Date.now().toString().slice(-4)}` : null
    });
  } catch (err) {
    next(err);
  }
};



// Obter detalhes da loja do usuário
export const getStore = async (req, res, next) => {
  try {
    const user = req.user;

    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Loja não encontrada' });
      }
      throw error;
    }

    res.status(200).json({ store: data });
  } catch (err) {
    next(err);
  }
};

// Atualizar loja
export const updateStore = async (req, res, next) => {
  try {
    const user = req.user;
    const storeData = storeSchema.partial().parse(req.body);

    // Verificar se a loja existe
    const { data: existingStore, error: checkError } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (checkError || !existingStore) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }

    // Atualizar loja
    const { data, error } = await supabase
      .from('stores')
      .update(storeData)
      .eq('id', existingStore.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(200).json({
      message: 'Loja atualizada com sucesso',
      store: data
    });
  } catch (err) {
    next(err);
  }
};

// Desativar loja
export const toggleStoreStatus = async (req, res, next) => {
  try {
    const user = req.user;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido. Use "active" ou "inactive"' });
    }

    // Verificar se a loja existe
    const { data: existingStore, error: checkError } = await supabase
      .from('stores')
      .select('id, status')
      .eq('user_id', user.id)
      .single();

    if (checkError || !existingStore) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }

    // Atualizar status da loja
    const { data, error } = await supabase
      .from('stores')
      .update({ status })
      .eq('id', existingStore.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(200).json({
      message: `Loja ${status === 'active' ? 'ativada' : 'desativada'} com sucesso`,
      store: data
    });
  } catch (err) {
    next(err);
  }
};