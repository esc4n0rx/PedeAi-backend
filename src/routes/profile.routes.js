import { Router } from 'express'
import { authMiddleware } from "../middlewares/authMiddleware.js"

const router = Router()

router.get('/', authMiddleware, (req, res) => {
  const user = (req).user
  res.json({ message: 'Perfil do usuário autenticado', user })
})

export default router
