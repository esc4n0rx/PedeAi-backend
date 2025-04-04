// src/controllers/login.controller.ts
import { Request, Response, NextFunction } from 'express'
import { loginSchema } from '../validators/auth.validator'
import { login } from '../services/auth.service'

export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, senha } = loginSchema.parse(req.body)
    const result = await login(email, senha)

    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
}
