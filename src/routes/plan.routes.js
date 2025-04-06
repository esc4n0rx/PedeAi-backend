// src/routes/plan.routes.js
import { Router } from 'express';
import { getCurrentPlan, getAllPlans } from '../controllers/plan.controller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { subscribe } from "../controllers/subscribe.controller.js";

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

/**
 * @swagger
 * /plans/current:
 *   get:
 *     summary: Obter plano atual
 *     tags: [Planos]
 *     description: Retorna informações detalhadas sobre o plano atual do usuário
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Informações do plano atual
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 plan:
 *                   $ref: '#/components/schemas/Plan'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/current', getCurrentPlan);

/**
 * @swagger
 * /plans/all:
 *   get:
 *     summary: Listar todos os planos
 *     tags: [Planos]
 *     description: Retorna informações sobre todos os planos disponíveis
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de planos disponíveis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 plans:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Identificador do plano
 *                       name:
 *                         type: string
 *                         description: Nome do plano
 *                       limits:
 *                         type: object
 *                         properties:
 *                           maxProducts:
 *                             type: string
 *                             description: Limite máximo de produtos (ou "Ilimitado")
 *                           maxCategories:
 *                             type: string
 *                             description: Limite máximo de categorias (ou "Ilimitado")
 *                       features:
 *                         type: array
 *                         items:
 *                           type: string
 *                         description: Recursos disponíveis no plano
 *                       isCurrent:
 *                         type: boolean
 *                         description: Indica se este é o plano atual do usuário
 *                 currentPlan:
 *                   type: string
 *                   description: Identificador do plano atual do usuário
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/all', getAllPlans);

/**
 * @swagger
 * /plans/subscribe:
 *   post:
 *     summary: Assinar um plano
 *     tags: [Planos]
 *     description: Cria uma sessão de checkout do Stripe para assinar um plano
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plano
 *             properties:
 *               plano:
 *                 type: string
 *                 enum: [vitrine, prateleira, mercado]
 *                 description: Identificador do plano a ser assinado
 *     responses:
 *       200:
 *         description: URL para checkout
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 checkout_url:
 *                   type: string
 *                   format: uri
 *                   description: URL para a página de checkout do Stripe
 *       400:
 *         description: Plano inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/subscribe', subscribe);

export default router;