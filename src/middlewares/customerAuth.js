// src/middlewares/customerAuth.js
import jwt from 'jsonwebtoken';

export const checkCustomerAuth = (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }
    
    const token = req.headers.authorization.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Verificar se é um token de cliente
      if (decoded.type !== 'customer') {
        return res.status(401).json({ error: 'Token inválido para cliente' });
      }
      
      // Adicionar informações do cliente à requisição
      req.customer = {
        id: decoded.id,
        store_id: decoded.store_id
      };
      
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
  } catch (err) {
    next(err);
  }
};

// Middleware para autenticação opcional
export const optionalCustomerAuth = (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      // Continuar sem autenticação
      return next();
    }
    
    const token = req.headers.authorization.split(' ')[1];
    
    if (!token) {
      // Continuar sem autenticação
      return next();
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (decoded.type === 'customer') {
        // Adicionar informações do cliente à requisição
        req.customer = {
          id: decoded.id,
          store_id: decoded.store_id
        };
      }
      
      next();
    } catch (err) {
      // Ignorar erro de token e continuar
      next();
    }
  } catch (err) {
    next(err);
  }
};