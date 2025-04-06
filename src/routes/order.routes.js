import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
  createNewOrder,
  getOrder,
  getAllOrders,
  updateStatus,
  uploadPaymentProof,
  confirmOrderPayment
} from '../controllers/order.controller.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Criar novo pedido
 *     tags: [Pedidos]
 *     description: Cria um novo pedido para a loja do usuário autenticado
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer
 *               - address
 *               - items
 *               - payment_method
 *             properties:
 *               customer:
 *                 type: object
 *                 required:
 *                   - name
 *                   - phone
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: Nome do cliente
 *                   phone:
 *                     type: string
 *                     description: Telefone do cliente
 *                   email:
 *                     type: string
 *                     format: email
 *                     description: Email do cliente (opcional)
 *               address:
 *                 type: object
 *                 required:
 *                   - street
 *                   - number
 *                   - neighborhood
 *                   - city
 *                   - zip_code
 *                 properties:
 *                   street:
 *                     type: string
 *                     description: Nome da rua
 *                   number:
 *                     type: string
 *                     description: Número do endereço
 *                   complement:
 *                     type: string
 *                     description: Complemento (opcional)
 *                   neighborhood:
 *                     type: string
 *                     description: Bairro
 *                   city:
 *                     type: string
 *                     description: Cidade
 *                   zip_code:
 *                     type: string
 *                     description: CEP
 *                   reference_point:
 *                     type: string
 *                     description: Ponto de referência (opcional)
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - product_id
 *                     - quantity
 *                   properties:
 *                     product_id:
 *                       type: string
 *                       format: uuid
 *                       description: ID do produto
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       description: Quantidade do produto
 *                     notes:
 *                       type: string
 *                       description: Observações sobre o item (opcional)
 *               coupon_code:
 *                 type: string
 *                 description: Código do cupom de desconto (opcional)
 *               payment_method:
 *                 type: string
 *                 enum: [pix, cartao, dinheiro]
 *                 description: Método de pagamento
 *               change_for:
 *                 type: number
 *                 description: Valor para troco (apenas para pagamento em dinheiro)
 *               notes:
 *                 type: string
 *                 description: Observações gerais sobre o pedido (opcional)
 *     responses:
 *       201:
 *         description: Pedido criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Pedido criado com sucesso
 *                 order:
 *                   $ref: '#/components/schemas/Order'
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
 *       403:
 *         description: Limite de clientes atingido (plano free)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', createNewOrder);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Listar pedidos
 *     tags: [Pedidos]
 *     description: Lista todos os pedidos da loja do usuário autenticado com filtros e paginação
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Limite de itens por página
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [em_processamento, em_preparacao, em_rota, finalizado, cancelado, recusado]
 *         description: Filtrar por status
 *       - in: query
 *         name: payment_method
 *         schema:
 *           type: string
 *           enum: [pix, cartao, dinheiro]
 *         description: Filtrar por método de pagamento
 *       - in: query
 *         name: payment_status
 *         schema:
 *           type: string
 *           enum: [pendente, confirmado, nao_confirmado]
 *         description: Filtrar por status de pagamento
 *       - in: query
 *         name: customer_phone
 *         schema:
 *           type: string
 *         description: Filtrar por telefone do cliente
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filtrar a partir de (data)
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filtrar até (data)
 *     responses:
 *       200:
 *         description: Lista de pedidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total de registros
 *                     page:
 *                       type: integer
 *                       description: Página atual
 *                     limit:
 *                       type: integer
 *                       description: Itens por página
 *                     pages:
 *                       type: integer
 *                       description: Total de páginas
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', getAllOrders);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Obter pedido
 *     tags: [Pedidos]
 *     description: Obtém detalhes de um pedido específico
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do pedido
 *     responses:
 *       200:
 *         description: Detalhes do pedido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Pedido não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', getOrder);

/**
 * @swagger
 * /orders/{id}/status:
 *   patch:
 *     summary: Atualizar status
 *     tags: [Pedidos]
 *     description: Atualiza o status de um pedido específico
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do pedido
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
 *                 enum: [em_processamento, em_preparacao, em_rota, finalizado, cancelado, recusado]
 *                 description: Novo status do pedido
 *               notes:
 *                 type: string
 *                 description: Observações sobre a mudança de status
 *     responses:
 *       200:
 *         description: Status atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Status do pedido atualizado para em_preparacao
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Dados inválidos ou transição de status não permitida
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
 *         description: Pedido não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:id/status', updateStatus);

/**
 * @swagger
 * /orders/{id}/payment-proof:
 *   patch:
 *     summary: Enviar comprovante de pagamento
 *     tags: [Pedidos]
 *     description: Envia comprovante de pagamento para pedidos com Pix
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do pedido
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payment_proof_url
 *             properties:
 *               payment_proof_url:
 *                 type: string
 *                 format: uri
 *                 description: URL do comprovante de pagamento
 *     responses:
 *       200:
 *         description: Comprovante enviado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Comprovante de pagamento atualizado
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Dados inválidos ou método de pagamento não é Pix
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
 *         description: Pedido não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:id/payment-proof', uploadPaymentProof);

/**
 * @swagger
 * /orders/{id}/confirm-payment:
 *   post:
 *     summary: Confirmar pagamento
 *     tags: [Pedidos]
 *     description: Confirma o pagamento de um pedido
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do pedido
 *     responses:
 *       200:
 *         description: Pagamento confirmado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Pagamento confirmado
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Pedido não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:id/confirm-payment', confirmOrderPayment);

export default router;