// src/routes/store.routes.js
import { Router } from 'express';
import { createStore, getStore, updateStore, toggleStoreStatus } from '../controllers/store.controller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Rotas CRUD para loja
router.post('/', createStore);
router.get('/', getStore);
router.put('/', updateStore);
router.patch('/status', toggleStoreStatus);

export default router;