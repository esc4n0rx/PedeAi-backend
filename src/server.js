import express from 'express'
import dotenv from 'dotenv'
import morgan from 'morgan'
import helmet from 'helmet';
import cors from 'cors';
import registerRoutes from "../src/routes/register.routes.js"
import authRoutes from "./routes/auth.routes.js";
import { errorHandler } from "../src/middlewares/errorHandler.js"
import profileRoutes from "../src/routes/profile.routes.js"
import planRoutes from "./routes/plan.routes.js"
import { handleStripeWebhook } from "./controllers/webhook.controller.js"
import { globalRateLimiter, authRateLimiter } from "./middlewares/rateLimiter.js";
import uploadRoutes from './routes/upload.routes.js';
import orderRoutes from './routes/order.routes.js';
import storeRoutes from './routes/store.routes.js';
import { validateEnv } from "./utils/validateEnv.js";
import productRoutes from './routes/product.routes.js';
import bodyParser from 'body-parser'
import { setupSwagger } from './config/swagger.js'; 

dotenv.config()

validateEnv();

const app = express()
app.post(
    '/webhook',
    bodyParser.raw({ type: 'application/json' }),
    handleStripeWebhook
)

const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['https://pedai-frontend.vercel.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400
};
  
app.use(cors(corsOptions));

app.use(globalRateLimiter);
app.use(express.json())
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
    },
  },
}));
app.use(morgan('dev'))

// Configurar Swagger
setupSwagger(app);

app.use('/register', authRateLimiter, registerRoutes)
app.use('/auth', authRateLimiter, authRoutes);
app.use('/orders', orderRoutes);
app.use('/perfil', profileRoutes)
app.use('/plans', planRoutes)
app.use('/store', storeRoutes);
app.use('/upload', uploadRoutes);
app.use('/products', productRoutes);

app.use(errorHandler)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
  console.log(`Documentação Swagger disponível em: http://localhost:${PORT}/api-docs`)
})
