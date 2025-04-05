// src/middlewares/rateLimiter.js
import rateLimit from 'express-rate-limit';

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limita cada IP a 100 requisições por janela
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições, por favor tente novamente mais tarde' }
});

export const authRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // limita tentativas de login
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de login, por favor tente novamente mais tarde' }
});