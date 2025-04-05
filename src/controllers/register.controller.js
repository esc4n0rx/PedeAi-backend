// src/controllers/register.controller.js
import { registerSchema } from "../validators/user.validator.js";
import { encrypt } from "../utils/encryption.js";
import { hash } from 'bcryptjs';
import { supabase } from "../config/supabase.js";

export const registerUser = async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const hashedPassword = await hash(data.senha, 10);

    const { error } = await supabase.from('users').insert({
      nome: data.nome,
      email: data.email,
      senha: hashedPassword,
      cpf_cnpj: encrypt(data.cpf_cnpj),
      telefone: data.telefone,
      endereco: data.endereco
    });

    if (error) throw error;

    res.status(201).json({ message: 'Usuário registrado com sucesso' });
  } catch (err) {
    next(err);
  }
};