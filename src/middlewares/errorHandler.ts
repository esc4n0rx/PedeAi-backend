// src/middlewares/errorHandler.ts
import { Request, Response, NextFunction } from 'express'

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  console.error(err)
  res.status(err.status || 500).json({ error: err.message || 'Erro interno' })
}
