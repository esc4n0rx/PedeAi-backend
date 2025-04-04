// src/controllers/product.controller.js
import { productSchema } from '../validators/product.validator.js';
import { supabase } from '../config/supabase.js';
import slugify from 'slugify';

// Criar um novo produto
export const createProduct = async (req, res, next) => {
  try {
    const user = req.user;
    const productData = productSchema.parse(req.body);

    // Verificar se a loja existe
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (storeError || !store) {
      return res.status(404).json({ error: 'Loja não encontrada. Crie uma loja primeiro.' });
    }

    // Se categoria foi informada, verificar se existe
    if (productData.category_id) {
      const { data: category, error: categoryError } = await supabase
        .from('product_categories')
        .select('id')
        .eq('id', productData.category_id)
        .eq('store_id', store.id)
        .single();

      if (categoryError || !category) {
        return res.status(400).json({ error: 'Categoria não encontrada ou não pertence à sua loja' });
      }
    }

    // Gerar slug se não fornecido
    const slug = productData.slug || slugify(productData.name, { lower: true, strict: true });

    // Criar novo produto
    const { data, error } = await supabase
      .from('products')
      .insert({
        store_id: store.id,
        name: productData.name,
        description: productData.description,
        price: productData.price,
        discount_price: productData.discount_price,
        image_url: productData.image_url,
        category_id: productData.category_id,
        serving_size: productData.serving_size,
        preparation_time: productData.preparation_time,
        ingredients: productData.ingredients,
        options: productData.options,
        allergens: productData.allergens,
        status: productData.status,
        is_featured: productData.is_featured,
        slug: slug
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      message: 'Produto criado com sucesso',
      product: data
    });
  } catch (err) {
    next(err);
  }
};

// Listar todos os produtos da loja
export const listProducts = async (req, res, next) => {
  try {
    const user = req.user;
    const { category, status, featured } = req.query;

    // Verificar se a loja existe
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (storeError || !store) {
      return res.status(404).json({ error: 'Loja não encontrada. Crie uma loja primeiro.' });
    }

    // Construir a query
    let query = supabase
      .from('products')
      .select(`
        *,
        product_categories(id, name)
      `)
      .eq('store_id', store.id);

    // Aplicar filtros se fornecidos
    if (category) {
      query = query.eq('category_id', category);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    // Executar a query
    const { data, error } = await query.order('name');

    if (error) {
      throw error;
    }

    res.status(200).json({
      products: data
    });
  } catch (err) {
    next(err);
  }
};

// Obter um produto específico
export const getProduct = async (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;

    // Verificar se a loja existe
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (storeError || !store) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }

    // Buscar o produto
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_categories(id, name)
      `)
      .eq('id', id)
      .eq('store_id', store.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Produto não encontrado ou não pertence à sua loja' });
    }

    res.status(200).json({
      product: data
    });
  } catch (err) {
    next(err);
  }
};

// Atualizar um produto
export const updateProduct = async (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const productData = productSchema.partial().parse(req.body);

    // Verificar se a loja existe
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (storeError || !store) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }

    // Verificar se o produto existe e pertence à loja
    const { data: existingProduct, error: productError } = await supabase
      .from('products')
      .select('id, name')
      .eq('id', id)
      .eq('store_id', store.id)
      .single();

    if (productError || !existingProduct) {
      return res.status(404).json({ error: 'Produto não encontrado ou não pertence à sua loja' });
    }

    // Se o nome foi alterado e não foi fornecido um novo slug, atualizar o slug
    let updateData = { ...productData };
    if (productData.name && !productData.slug) {
      updateData.slug = slugify(productData.name, { lower: true, strict: true });
    }

    // Atualizar produto
    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(200).json({
      message: 'Produto atualizado com sucesso',
      product: data
    });
  } catch (err) {
    next(err);
  }
};

// Excluir um produto
export const deleteProduct = async (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;

    // Verificar se a loja existe
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (storeError || !store) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }

    // Verificar se o produto existe e pertence à loja
    const { data: existingProduct, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', id)
      .eq('store_id', store.id)
      .single();

    if (productError || !existingProduct) {
      return res.status(404).json({ error: 'Produto não encontrado ou não pertence à sua loja' });
    }

    // Excluir produto
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.status(200).json({
      message: 'Produto excluído com sucesso'
    });
  } catch (err) {
    next(err);
  }
};

// Alterar o status do produto (active, inactive, out_of_stock)
export const changeProductStatus = async (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'out_of_stock'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido. Use "active", "inactive" ou "out_of_stock"' });
    }

    // Verificar se a loja existe
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (storeError || !store) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }

    // Verificar se o produto existe e pertence à loja
    const { data: existingProduct, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', id)
      .eq('store_id', store.id)
      .single();

    if (productError || !existingProduct) {
      return res.status(404).json({ error: 'Produto não encontrado ou não pertence à sua loja' });
    }

    // Atualizar status do produto
    const { data, error } = await supabase
      .from('products')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(200).json({
      message: `Status do produto alterado para ${status}`,
      product: data
    });
  } catch (err) {
    next(err);
  }
};

// Destacar ou remover destaque de um produto
export const toggleFeatured = async (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { is_featured } = req.body;

    if (typeof is_featured !== 'boolean') {
      return res.status(400).json({ error: 'is_featured deve ser um valor booleano' });
    }

    // Verificar se a loja existe
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (storeError || !store) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }

    // Verificar se o produto existe e pertence à loja
    const { data: existingProduct, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', id)
      .eq('store_id', store.id)
      .single();

    if (productError || !existingProduct) {
      return res.status(404).json({ error: 'Produto não encontrado ou não pertence à sua loja' });
    }

    // Atualizar is_featured do produto
    const { data, error } = await supabase
      .from('products')
      .update({ is_featured })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(200).json({
      message: is_featured ? 'Produto destacado com sucesso' : 'Destaque do produto removido',
      product: data
    });
  } catch (err) {
    next(err);
  }
};