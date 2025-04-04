// src/controllers/productCategory.controller.js
import { productCategorySchema } from '../validators/product.validator.js';
import { supabase } from '../config/supabase.js';

// Criar uma nova categoria de produto
export const createCategory = async (req, res, next) => {
  try {
    const user = req.user;
    const categoryData = productCategorySchema.parse(req.body);

    // Verificar se a loja existe
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (storeError || !store) {
      return res.status(404).json({ error: 'Loja não encontrada. Crie uma loja primeiro.' });
    }

    // Criar nova categoria
    const { data, error } = await supabase
      .from('product_categories')
      .insert({
        store_id: store.id,
        name: categoryData.name,
        description: categoryData.description,
        display_order: categoryData.display_order || 0
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      message: 'Categoria criada com sucesso',
      category: data
    });
  } catch (err) {
    next(err);
  }
};

// Listar todas as categorias da loja
export const listCategories = async (req, res, next) => {
  try {
    const user = req.user;

    // Verificar se a loja existe
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (storeError || !store) {
      return res.status(404).json({ error: 'Loja não encontrada. Crie uma loja primeiro.' });
    }

    // Listar categorias
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('store_id', store.id)
      .order('display_order', { ascending: true });

    if (error) {
      throw error;
    }

    res.status(200).json({
      categories: data
    });
  } catch (err) {
    next(err);
  }
};

// Atualizar uma categoria
export const updateCategory = async (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const categoryData = productCategorySchema.partial().parse(req.body);

    // Verificar se a loja existe
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (storeError || !store) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }

    // Verificar se a categoria existe e pertence à loja
    const { data: existingCategory, error: categoryError } = await supabase
      .from('product_categories')
      .select('id')
      .eq('id', id)
      .eq('store_id', store.id)
      .single();

    if (categoryError || !existingCategory) {
      return res.status(404).json({ error: 'Categoria não encontrada ou não pertence à sua loja' });
    }

    // Atualizar categoria
    const { data, error } = await supabase
      .from('product_categories')
      .update(categoryData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(200).json({
      message: 'Categoria atualizada com sucesso',
      category: data
    });
  } catch (err) {
    next(err);
  }
};

// Excluir uma categoria
export const deleteCategory = async (req, res, next) => {
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

    // Verificar se a categoria existe e pertence à loja
    const { data: existingCategory, error: categoryError } = await supabase
      .from('product_categories')
      .select('id')
      .eq('id', id)
      .eq('store_id', store.id)
      .single();

    if (categoryError || !existingCategory) {
      return res.status(404).json({ error: 'Categoria não encontrada ou não pertence à sua loja' });
    }

    // Excluir categoria
    const { error } = await supabase
      .from('product_categories')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.status(200).json({
      message: 'Categoria excluída com sucesso'
    });
  } catch (err) {
    next(err);
  }
};