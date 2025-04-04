// src/routes/product.routes.js
import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { 
  createProduct, 
  listProducts, 
  getProduct, 
  updateProduct, 
  deleteProduct,
  changeProductStatus,
  toggleFeatured
} from '../controllers/product.controller.js';
import { 
  createCategory, 
  listCategories, 
  updateCategory, 
  deleteCategory 
} from '../controllers/productCategory.controller.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Rotas para categorias
router.post('/categories', createCategory);
router.get('/categories', listCategories);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Rotas para produtos
router.post('/', createProduct);
router.get('/', listProducts);
router.get('/:id', getProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.patch('/:id/status', changeProductStatus);
router.patch('/:id/featured', toggleFeatured);

export default router;