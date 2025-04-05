// src/middlewares/sanitizer.ts
import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const sanitizeUserInput = [
  body('email').trim().escape(),
  body('nome').trim(),
  body('endereco').trim(),
  body('telefone').trim(),
  body('cpf_cnpj').trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];