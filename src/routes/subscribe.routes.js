import { Router } from 'express'
import { subscribe } from "../controllers/subscribe.controller.js"
import { authMiddleware } from "../middlewares/authMiddleware.js"

const router = Router()

router.post('/', authMiddleware, subscribe)

export default router
