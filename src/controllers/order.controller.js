import {
    createOrder,
    getOrderById,
    listOrders,
    updateOrderStatus,
    updatePaymentProof,
    confirmPayment
  } from '../services/order.service.js';
  import {
    orderSchema,
    orderStatusUpdateSchema,
    paymentProofSchema
  } from '../validators/order.validator.js';
  
  /**
   * Cria um novo pedido
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   * @param {NextFunction} next - Função next do Express
   */
  export const createNewOrder = async (req, res, next) => {
    try {
      const orderData = orderSchema.parse(req.body);
      const user = req.user;
  
      const order = await createOrder(orderData, user);
  
      res.status(201).json({
        message: 'Pedido criado com sucesso',
        order
      });
    } catch (err) {
      next(err);
    }
  };
  
  /**
   * Obtém detalhes de um pedido específico
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   * @param {NextFunction} next - Função next do Express
   */
  export const getOrder = async (req, res, next) => {
    try {
      const { id } = req.params;
      const user = req.user;
  
      const order = await getOrderById(id, user);
  
      res.status(200).json({
        order
      });
    } catch (err) {
      next(err);
    }
  };
  
  /**
   * Lista pedidos com filtros e paginação
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   * @param {NextFunction} next - Função next do Express
   */
  export const getAllOrders = async (req, res, next) => {
    try {
      const user = req.user;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      
      // Extrair filtros da query
      const filters = {
        status: req.query.status,
        payment_method: req.query.payment_method,
        payment_status: req.query.payment_status,
        customer_phone: req.query.customer_phone,
        date_from: req.query.date_from,
        date_to: req.query.date_to
      };
  
      const result = await listOrders(filters, user, page, limit);
  
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };
  
  /**
   * Atualiza o status de um pedido
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   * @param {NextFunction} next - Função next do Express
   */
  export const updateStatus = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, notes } = orderStatusUpdateSchema.parse(req.body);
      const user = req.user;
  
      const updatedOrder = await updateOrderStatus(id, status, notes, user);
  
      res.status(200).json({
        message: `Status do pedido atualizado para ${status}`,
        order: updatedOrder
      });
    } catch (err) {
      next(err);
    }
  };
  
  /**
   * Atualiza comprovante de pagamento para pedidos Pix
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   * @param {NextFunction} next - Função next do Express
   */
  export const uploadPaymentProof = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { payment_proof_url } = paymentProofSchema.parse(req.body);
      const user = req.user;
  
      const updatedOrder = await updatePaymentProof(id, payment_proof_url, user);
  
      res.status(200).json({
        message: 'Comprovante de pagamento atualizado',
        order: updatedOrder
      });
    } catch (err) {
      next(err);
    }
  };
  
  /**
   * Confirma o pagamento de um pedido
   * @param {Request} req - Requisição Express
   * @param {Response} res - Resposta Express
   * @param {NextFunction} next - Função next do Express
   */
  export const confirmOrderPayment = async (req, res, next) => {
    try {
      const { id } = req.params;
      const user = req.user;
  
      const updatedOrder = await confirmPayment(id, user);
  
      res.status(200).json({
        message: 'Pagamento confirmado',
        order: updatedOrder
      });
    } catch (err) {
      next(err);
    }
  };