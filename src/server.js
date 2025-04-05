// src/server.js
import express from 'express'
import dotenv from 'dotenv'
import morgan from 'morgan'
import helmet from 'helmet';
import cors from 'cors';
import registerRoutes from "../src/routes/register.routes.js"
import authRoutes from "./routes/auth.routes.js";
import { errorHandler } from "../src/middlewares/errorHandler.js"
import profileRoutes from "../src/routes/profile.routes.js"
import subscribeRoutes from "../src/routes/subscribe.routes.js"
import { handleStripeWebhook } from "./controllers/webhook.controller.js"
import { globalRateLimiter, authRateLimiter } from "./middlewares/rateLimiter.js";
import storeRoutes from './routes/store.routes.js';
import { validateEnv } from "./utils/validateEnv.js";
import bodyParser from 'body-parser'

dotenv.config()

validateEnv();

const app = express()
app.post(
    '/webhook',
    bodyParser.raw({ type: 'application/json' }),
    handleStripeWebhook
)

const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400
};
  
app.use(cors(corsOptions));

app.use(globalRateLimiter);
app.use(express.json())
app.use(helmet());
app.use(morgan('dev'))

app.use('/register', authRateLimiter, registerRoutes)
app.use('/auth', authRateLimiter, authRoutes);
app.use('/perfil', profileRoutes)
app.use('/subscribe', subscribeRoutes)
app.use('/store', storeRoutes);

app.use(errorHandler)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
})