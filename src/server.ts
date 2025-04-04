// src/server.ts
import express from 'express'
import dotenv from 'dotenv'
import morgan from 'morgan'
import registerRoutes from '../src/routes/register.routes'
import loginRoutes from '../src/routes/login.routes'
import { errorHandler } from '../src/middlewares/errorHandler'
import profileRoutes from '../src/routes/profile.routes'
import subscribeRoutes from '../src/routes/subscribe.routes'
import { handleStripeWebhook } from './controllers/webhook.controller'
import bodyParser from 'body-parser'

dotenv.config()
console.log(process.env.SUPABASE_URL)

const app = express()
app.post(
    '/webhook',
    bodyParser.raw({ type: 'application/json' }),
    handleStripeWebhook
  )

app.use(express.json())

app.use(morgan('dev'))

app.use('/register', registerRoutes)
app.use('/login', loginRoutes)
app.use('/perfil', profileRoutes)
app.use('/subscribe', subscribeRoutes)

app.use(errorHandler)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
})
