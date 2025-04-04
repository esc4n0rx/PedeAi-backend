// src/controllers/register.controller.ts
import { Request, Response, NextFunction } from 'express'
import { registerSchema } from '../validators/user.validator'
import { hash } from 'bcryptjs'
import { supabase } from '../config/supabase'

export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = registerSchema.parse(req.body)
    const hashedPassword = await hash(data.senha, 10)

    const { error } = await supabase.from('users').insert({
      nome: data.nome,
      email: data.email,
      senha: hashedPassword,
      cpf_cnpj: data.cpf_cnpj,
      telefone: data.telefone,
      endereco: data.endereco
    })

    if (error) throw error

    res.status(201).json({ message: 'Usuário registrado com sucesso' })
  } catch (err) {
    next(err)
  }
}
