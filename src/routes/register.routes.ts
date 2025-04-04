// src/routes/register.routes.ts
import { Router } from 'express'
import { registerUser } from '../controllers/register.controller'

const router = Router()
router.post('/', registerUser)

export default router
