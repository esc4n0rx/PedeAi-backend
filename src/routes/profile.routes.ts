import { Router } from 'express'
import { authMiddleware } from '../middlewares/authMiddleware'
import { Request, Response } from 'express'

const router = Router()

router.get('/', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user
  res.json({ message: 'Perfil do usuário autenticado', user })
})

export default router
