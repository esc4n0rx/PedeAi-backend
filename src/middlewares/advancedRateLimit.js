// src/middlewares/advancedRateLimit.js
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

// Variável para armazenar o cliente Redis
let redisClient;

// Função para criar um novo store com um prefixo único
const createRedisStore = (prefix) => {
    if (!process.env.REDIS_URL) {
        return undefined; // Retorna undefined para usar o store em memória
    }
    
    // Inicializa o cliente Redis se ainda não existir
    if (!redisClient) {
        redisClient = createClient({
            url: process.env.REDIS_URL
        });
        
        redisClient.connect().catch(console.error);
    }
    
    // Retorna um novo store com prefixo único
    return new RedisStore({
        prefix: `ratelimit:${prefix}:`, // Prefixo único para cada store
        sendCommand: (...args) => redisClient.sendCommand(args)
    });
};

// Rate limiter para APIs públicas com controle por IP
export const publicApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requisições por janela
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore('public'),
    message: { error: 'Muitas requisições. Por favor, tente novamente mais tarde.' }
});

// Rate limiter específico para tentativas de pedido
export const orderCreationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 10, // 10 pedidos por hora
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore('order'),
    message: { 
        error: 'Limite de pedidos excedido', 
        message: 'Você atingiu o limite de pedidos. Por favor, tente novamente mais tarde.' 
    },
    keyGenerator: (req) => {
        const customerPhone = req.body?.customer?.phone?.replace(/\D/g, '');
        return customerPhone || req.ip;
    }
});

// Rate limiter por loja para evitar sobrecarga de uma loja específica
export const storeAccessLimiter = (storeId) => {
    return rateLimit({
        windowMs: 5 * 60 * 1000, // 5 minutos
        max: 500, // 500 requisições por 5 minutos por loja
        standardHeaders: true,
        legacyHeaders: false,
        store: createRedisStore(`store:${storeId}`),
        message: { 
            error: 'Serviço temporariamente indisponível', 
            message: 'Esta loja está com muitos acessos no momento. Por favor, tente novamente em alguns minutos.' 
        }
    });
};