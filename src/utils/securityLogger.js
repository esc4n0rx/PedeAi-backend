// src/utils/securityLogger.js
import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';

// Configurar diretório de logs
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Logger para eventos de segurança
export const securityLogger = {
  log: (event, data) => {
    const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    const logEntry = {
      timestamp,
      event,
      ...data
    };
    
    const logFile = path.join(logDir, `security-${format(new Date(), 'yyyy-MM-dd')}.log`);
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    
    // Log no console em ambiente de desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SECURITY] ${event}:`, data);
    }
  },
  
  // Eventos específicos
  failedAuthentication: (req, reason) => {
    securityLogger.log('FAILED_AUTH', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      path: req.path,
      reason
    });
  },
  
  suspiciousActivity: (req, details) => {
    securityLogger.log('SUSPICIOUS_ACTIVITY', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      path: req.path,
      method: req.method,
      details
    });
  },
  
  accessDenied: (req, reason) => {
    securityLogger.log('ACCESS_DENIED', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      path: req.path,
      reason
    });
  }
};

// Middleware para logging de requisições suspeitas
export const securityMonitoring = (req, res, next) => {
  // Lista de padrões suspeitos nos parâmetros ou corpo
  const suspiciousPatterns = [
    /((select|union|insert|delete|update|drop|alter)(\s+))/i, // SQL Injection
    /<script>/i, // XSS básico
    /javascript:/i, // XSS em URLs
    /\.\.\//i // Path Traversal
  ];
  
  // Verificar parâmetros da URL
  for (const param in req.query) {
    const value = req.query[param];
    if (typeof value === 'string') {
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(value)) {
          securityLogger.suspiciousActivity(req, {
            type: 'SUSPICIOUS_QUERY_PARAM',
            param,
            value
          });
          break;
        }
      }
    }
  }
  
  // Verificar corpo da requisição (exceto uploads)
  if (req.body && req.headers['content-type'] !== 'multipart/form-data') {
    const bodyStr = JSON.stringify(req.body);
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(bodyStr)) {
        securityLogger.suspiciousActivity(req, {
          type: 'SUSPICIOUS_BODY',
          body: req.body
        });
        break;
      }
    }
  }
  
  next();
};