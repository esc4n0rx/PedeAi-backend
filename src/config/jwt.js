// src/config/jwt.js

export const jwtConfig = {
  access: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  },
  refresh: {
    secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  }
};

export function validateJwtConfig() {
  if (!jwtConfig.access.secret) {
    throw new Error('JWT_SECRET não definido em variáveis de ambiente');
  }
}