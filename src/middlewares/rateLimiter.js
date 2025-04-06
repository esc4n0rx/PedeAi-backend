
import rateLimit from 'express-rate-limit';

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições, por favor tente novamente mais tarde' }
});

export const authRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 10, 
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de login, por favor tente novamente mais tarde' }
});