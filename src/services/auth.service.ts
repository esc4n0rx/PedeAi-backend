// src/services/auth.service.ts
import { supabase } from '../config/supabase'
import { compare } from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Secret, SignOptions } from 'jsonwebtoken'

export async function login(email: string, senha: string) {
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .limit(1)

  if (error || !users || users.length === 0) {
    throw new Error('Usuário ou senha inválidos')
  }

  const user = users[0]
  const senhaValida = await compare(senha, user.senha)

  if (!senhaValida) {
    throw new Error('Usuário ou senha inválidos')
  }

  // Verificar se o JWT_SECRET existe
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined');
  }

  // Criamos um helper para fazer o sign do token e contornar problemas de tipagem
  function createJwtToken(
    payload: object,
    secret: string, 
    options: { expiresIn: string }
  ): string {
    return jwt.sign(
      payload, 
      secret as Secret, 
      options as SignOptions
    );
  }

  const token = createJwtToken(
    { id: user.id, email: user.email },
    jwtSecret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );

  return {
    token,
    user: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      plan_active: user.plan_active
    }
  }
}