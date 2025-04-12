// src/routes/public.routes.js
import { Router } from 'express';
import { 
  getStoreBySlug,
  getStoreProducts, 
  getProductsByCategory
} from '../controllers/store.controller.js';
import {
  identifyCustomer,
  createCustomerOrder,
  getOrderStatus,
  cancelOrder
} from '../controllers/customer.controller.js';
import { checkCustomerAuth } from '../middlewares/customerAuth.js';

const router = Router();

// Rotas que não precisam de autenticação
router.get('/store/:slug', getStoreBySlug);
router.get('/products/:storeId', getStoreProducts);
router.get('/products/:storeId/category/:categoryId', getProductsByCategory);

// Identificação inicial do cliente
router.post('/store/:storeId/identify', identifyCustomer);

// Criação de pedido
router.post('/store/:storeId/order', createCustomerOrder);

// Rotas que podem usar autenticação opcional
router.get('/order/:orderId/status', getOrderStatus);

// Rotas que exigem autenticação de cliente
router.post('/order/:orderId/cancel', checkCustomerAuth, cancelOrder);

export default router;