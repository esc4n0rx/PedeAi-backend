// src/middlewares/advancedRateLimit.js
import { rateLimit } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';
import { securityLogger } from '../utils/securityLogger.js';

// Criar cliente Redis se estiver configurado
let redisClient;
let store;

if (process.env.REDIS_URL) {
  redisClient = createClient({
    url: process.env.REDIS_URL
  });
  
  redisClient.connect().catch(console.error);
  
  store = new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args)
  });
}

// Rate limiter para APIs públicas com controle por IP
export const publicApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requisições por janela
  standardHeaders: true,
  legacyHeaders: false,
  store: store,
  message: { error: 'Muitas requisições. Por favor, tente novamente mais tarde.' },
  handler: (req, res, next, options) => {
    securityLogger.accessDenied(req, 'RATE_LIMIT_EXCEEDED');
    res.status(429).json(options.message);
  }
});

// Rate limiter específico para tentativas de pedido
export const orderCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // 10 pedidos por hora
  standardHeaders: true,
  legacyHeaders: false,
  store: store,
  message: { 
    error: 'Limite de pedidos excedido', 
    message: 'Você atingiu o limite de pedidos. Por favor, tente novamente mais tarde.' 
  },
  handler: (req, res, next, options) => {
    securityLogger.accessDenied(req, 'ORDER_LIMIT_EXCEEDED');
    res.status(429).json(options.message);
  },
  // A chave será baseada no telefone do cliente ou IP se não houver telefone
  keyGenerator: (req) => {
    const customerPhone = req.body?.customer?.phone?.replace(/\D/g, '');
    return customerPhone || req.ip;
  }
});

// Rate limiter por loja para evitar sobrecarga de uma loja específica
export const storeAccessLimiter = (storeId) => {
  const limiterKey = `store:${storeId}`;
  
  return rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutos
    max: 500, // 500 requisições por 5 minutos por loja
    standardHeaders: true,
    legacyHeaders: false,
    store: store,
    message: { 
      error: 'Serviço temporariamente indisponível', 
      message: 'Esta loja está com muitos acessos no momento. Por favor, tente novamente em alguns minutos.' 
    },
    // A chave será a loja específica
    keyGenerator: () => limiterKey
  });
};