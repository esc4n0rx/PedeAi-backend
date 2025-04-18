
import { jwtConfig } from "../config/jwt.js";
import { supabase } from "../config/supabase.js";
import { compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';


function createToken(payload, secret, options) {
  return jwt.sign(payload, secret, options);
}


function verifyToken(token, secret) {
  return jwt.verify(token, secret);
}

export async function login(email, senha) {
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .limit(1);

  if (error || !users || users.length === 0) {
    throw new Error('Usuário ou senha inválidos');
  }

  const user = users[0];
  const senhaValida = await compare(senha, user.senha);

  if (!senhaValida) {
    throw new Error('Usuário ou senha inválidos');
  }

  
  const accessToken = createToken(
    { id: user.id, email: user.email },
    jwtConfig.access.secret,
    { expiresIn: jwtConfig.access.expiresIn }
  );

  
  const refreshToken = createToken(
    { id: user.id, tokenVersion: uuidv4() },
    jwtConfig.refresh.secret,
    { expiresIn: jwtConfig.refresh.expiresIn }
  );

  
  await supabase
    .from('refresh_tokens')
    .insert({
      user_id: user.id,
      token: refreshToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
    });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      plan_active: user.plan_active
    }
  };
}

export async function refreshAccessToken(refreshToken) {
  try {
    const decoded = verifyToken(refreshToken, jwtConfig.refresh.secret);
    
    const { data, error } = await supabase
      .from('refresh_tokens')
      .select('*')
      .eq('token', refreshToken)
      .eq('user_id', decoded.id)
      .single();
    
    if (error || !data) {
      throw new Error('Refresh token inválido');
    }
    
    if (new Date(data.expires_at) < new Date()) {
      throw new Error('Refresh token expirado');
    }
    
    // Buscar dados do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.id)
      .single();
      
    if (userError || !userData) {
      throw new Error('Usuário não encontrado');
    }
    
    const accessToken = createToken(
      { id: userData.id, email: userData.email },
      jwtConfig.access.secret,
      { expiresIn: jwtConfig.access.expiresIn }
    );
    
    return {
      accessToken,
      user: {
        id: userData.id,
        nome: userData.nome,
        email: userData.email,
        plan_active: userData.plan_active
      }
    };
  } catch (error) {
    
    console.error('Erro ao renovar token:', error);
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Token inválido: ' + error.message);
    } else if (error.name === 'TokenExpiredError') {
      throw new Error('Token expirado');
    } else {
      throw new Error('Não foi possível renovar o token de acesso: ' + error.message);
    }
  }
}

export async function logout(userId, refreshToken) {
  const { error } = await supabase
    .from('refresh_tokens')
    .delete()
    .match({ user_id: userId, token: refreshToken });
    
  if (error) {
    throw new Error('Erro ao realizar logout');
  }
  
  return { success: true };
}