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
        business_hours: storeData.business_hours || {}
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      message: 'Loja criada com sucesso',
      store: data
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