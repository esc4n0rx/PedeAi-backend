import { Router } from 'express'
import { subscribe } from '../controllers/subscribe.controller'
import { authMiddleware } from '../middlewares/authMiddleware'

const router = Router()

router.post('/', authMiddleware, subscribe)

export default router
