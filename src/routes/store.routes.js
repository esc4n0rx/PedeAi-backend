// src/routes/store.routes.js
import { Router } from 'express';
import { createStore, getStore, updateStore, toggleStoreStatus,checkSlugAvailability } from '../controllers/store.controller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

/**
 * @swagger
 * /store:
 *   post:
 *     summary: Criar loja
 *     tags: [Loja]
 *     description: Cria uma nova loja para o usuário autenticado
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - address
 *               - neighborhood
 *               - city
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 description: Nome da loja
 *               address:
 *                 type: string
 *                 minLength: 5
 *                 description: Endereço da loja
 *               neighborhood:
 *                 type: string
 *                 minLength: 2
 *                 description: Bairro
 *               city:
 *                 type: string
 *                 minLength: 2
 *                 description: Cidade
 *               logo_url:
 *                 type: string
 *                 format: uri
 *                 description: URL do logo
 *               banner_url:
 *                 type: string
 *                 format: uri
 *                 description: URL do banner
 *               theme:
 *                 type: string
 *                 default: default
 *                 description: Tema da loja
 *               payment_methods:
 *                 type: array
 *                 items:
 *                   type: string
 *                 default: [dinheiro, cartão]
 *                 description: Métodos de pagamento aceitos
 *               business_hours:
 *                 type: object
 *                 description: Horário de funcionamento por dia da semana
 *     responses:
 *       201:
 *         description: Loja criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Loja criada com sucesso
 *                 store:
 *                   $ref: '#/components/schemas/Store'
 *       400:
 *         description: Dados inválidos
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
 *       409:
 *         description: Usuário já possui uma loja
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Usuário já possui uma loja cadastrada
 */
router.post('/', createStore);

/**
 * @swagger
 * /store:
 *   get:
 *     summary: Obter loja
 *     tags: [Loja]
 *     description: Obtém os detalhes da loja do usuário autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Detalhes da loja
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 store:
 *                   $ref: '#/components/schemas/Store'
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
router.get('/', getStore);

/**
 * @swagger
 * /store:
 *   put:
 *     summary: Atualizar loja
 *     tags: [Loja]
 *     description: Atualiza os dados da loja do usuário autenticado
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 description: Nome da loja
 *               address:
 *                 type: string
 *                 minLength: 5
 *                 description: Endereço da loja
 *               neighborhood:
 *                 type: string
 *                 minLength: 2
 *                 description: Bairro
 *               city:
 *                 type: string
 *                 minLength: 2
 *                 description: Cidade
 *               logo_url:
 *                 type: string
 *                 format: uri
 *                 description: URL do logo
 *               banner_url:
 *                 type: string
 *                 format: uri
 *                 description: URL do banner
 *               theme:
 *                 type: string
 *                 description: Tema da loja
 *               payment_methods:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Métodos de pagamento aceitos
 *               business_hours:
 *                 type: object
 *                 description: Horário de funcionamento por dia da semana
 *     responses:
 *       200:
 *         description: Loja atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Loja atualizada com sucesso
 *                 store:
 *                   $ref: '#/components/schemas/Store'
 *       400:
 *         description: Dados inválidos
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
 *       404:
 *         description: Loja não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/', updateStore);

/**
 * @swagger
 * /store/status:
 *   patch:
 *     summary: Alterar status da loja
 *     tags: [Loja]
 *     description: Ativa ou desativa a loja do usuário autenticado
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: Novo status da loja
 *     responses:
 *       200:
 *         description: Status alterado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Loja ativada com sucesso
 *                 store:
 *                   $ref: '#/components/schemas/Store'
 *       400:
 *         description: Status inválido
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
 *       404:
 *         description: Loja não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/status', toggleStoreStatus);


router.get('/check-slug/:slug', checkSlugAvailability);

export default router;