// src/routes/dashboard.routes.js
import { Router } from 'express';
import { getDashboardInsights } from '../controllers/dashboard.controller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

/**
 * @swagger
 * /dashboard/insights:
 *   get:
 *     summary: Obter insights para o dashboard
 *     tags: [Dashboard]
 *     description: Retorna dados agregados para exibição no dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Insights do dashboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 insights:
 *                   type: object
 *                   properties:
 *                     ordersStats:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           description: Total de pedidos
 *                         today:
 *                           type: integer
 *                           description: Pedidos de hoje
 *                         growth:
 *                           type: number
 *                           description: Percentual de crescimento
 *                     pendingOrders:
 *                       type: object
 *                       properties:
 *                         count:
 *                           type: integer
 *                           description: Número de pedidos pendentes
 *                         lastUpdate:
 *                           type: string
 *                           format: date-time
 *                           description: Última atualização
 *                     revenue:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                           description: Faturamento total
 *                         thisWeek:
 *                           type: number
 *                           description: Faturamento desta semana
 *                         growth:
 *                           type: number
 *                           description: Percentual de crescimento
 *                     customers:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           description: Total de clientes
 *                         newThisWeek:
 *                           type: integer
 *                           description: Novos clientes desta semana
 *                         growth:
 *                           type: number
 *                           description: Percentual de crescimento
 *                     salesChart:
 *                       type: object
 *                       properties:
 *                         data:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               day:
 *                                 type: string
 *                                 description: Dia da semana
 *                               value:
 *                                 type: number
 *                                 description: Valor das vendas
 *                         currentDay:
 *                           type: string
 *                           description: Dia atual da semana
 *                     popularProducts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             description: Nome do produto
 *                           sales:
 *                             type: integer
 *                             description: Quantidade vendida
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Loja não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/insights', authMiddleware, getDashboardInsights);

export default router;