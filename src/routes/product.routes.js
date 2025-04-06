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
import { 
  checkProductLimitMiddleware,
  checkCategoryLimitMiddleware,
  checkFeatureAccessMiddleware
} from '../middlewares/planLimits.middleware.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

/**
 * @swagger
 * /products/categories:
 *   post:
 *     summary: Criar categoria de produto
 *     tags: [Categorias]
 *     description: Cria uma nova categoria de produtos (limitado pelo plano)
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
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 description: Nome da categoria
 *               description:
 *                 type: string
 *                 description: Descrição da categoria
 *               display_order:
 *                 type: integer
 *                 minimum: 0
 *                 description: Ordem de exibição da categoria
 *     responses:
 *       201:
 *         description: Categoria criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Categoria criada com sucesso
 *                 category:
 *                   $ref: '#/components/schemas/ProductCategory'
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
 *         description: Limite de categorias atingido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Limite de categorias atingido
 *                 message:
 *                   type: string
 *                 currentCount:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 planName:
 *                   type: string
 *                 upgrade:
 *                   type: boolean
 *       404:
 *         description: Loja não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/categories', checkCategoryLimitMiddleware, createCategory);

/**
 * @swagger
 * /products/categories:
 *   get:
 *     summary: Listar categorias
 *     tags: [Categorias]
 *     description: Lista todas as categorias de produtos da loja
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de categorias
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProductCategory'
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
router.get('/categories', listCategories);

/**
 * @swagger
 * /products/categories/{id}:
 *   put:
 *     summary: Atualizar categoria
 *     tags: [Categorias]
 *     description: Atualiza uma categoria existente
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da categoria
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 description: Nome da categoria
 *               description:
 *                 type: string
 *                 description: Descrição da categoria
 *               display_order:
 *                 type: integer
 *                 minimum: 0
 *                 description: Ordem de exibição da categoria
 *     responses:
 *       200:
 *         description: Categoria atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Categoria atualizada com sucesso
 *                 category:
 *                   $ref: '#/components/schemas/ProductCategory'
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
 *         description: Categoria não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/categories/:id', updateCategory);

/**
 * @swagger
 * /products/categories/{id}:
 *   delete:
 *     summary: Excluir categoria
 *     tags: [Categorias]
 *     description: Exclui uma categoria existente
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da categoria
 *     responses:
 *       200:
 *         description: Categoria excluída com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Categoria excluída com sucesso
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Categoria não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/categories/:id', deleteCategory);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Criar produto
 *     tags: [Produtos]
 *     description: Cria um novo produto (limitado pelo plano)
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
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 description: Nome do produto
 *               description:
 *                 type: string
 *                 description: Descrição do produto
 *               price:
 *                 type: number
 *                 format: float
 *                 minimum: 0.01
 *                 description: Preço do produto
 *               discount_price:
 *                 type: number
 *                 format: float
 *                 minimum: 0.01
 *                 description: Preço com desconto
 *               image_url:
 *                 type: string
 *                 format: uri
 *                 description: URL da imagem do produto
 *               category_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID da categoria
 *               serving_size:
 *                 type: string
 *                 description: Tamanho da porção
 *               preparation_time:
 *                 type: integer
 *                 description: Tempo de preparo em minutos
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Lista de ingredientes
 *               options:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     price:
 *                       type: number
 *                     required:
 *                       type: boolean
 *                 description: Opções do produto
 *               allergens:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Lista de alérgenos
 *               status:
 *                 type: string
 *                 enum: [active, inactive, out_of_stock]
 *                 default: active
 *                 description: Status do produto
 *               is_featured:
 *                 type: boolean
 *                 default: false
 *                 description: Produto em destaque
 *               slug:
 *                 type: string
 *                 description: Slug para URL amigável
 *     responses:
 *       201:
 *         description: Produto criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Produto criado com sucesso
 *                 product:
 *                   $ref: '#/components/schemas/Product'
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
 *         description: Limite de produtos atingido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Limite de produtos atingido
 *                 message:
 *                   type: string
 *                 currentCount:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 planName:
 *                   type: string
 *                 upgrade:
 *                   type: boolean
 *       404:
 *         description: Loja não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', checkProductLimitMiddleware, createProduct);

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Listar produtos
 *     tags: [Produtos]
 *     description: Lista todos os produtos da loja
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por ID da categoria
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, out_of_stock]
 *         description: Filtrar por status
 *       - in: query
 *         name: featured
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filtrar produtos destacados
 *     responses:
 *       200:
 *         description: Lista de produtos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
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
router.get('/', listProducts);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Obter produto
 *     tags: [Produtos]
 *     description: Obtém detalhes de um produto específico
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do produto
 *     responses:
 *       200:
 *         description: Detalhes do produto
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Produto não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', getProduct);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Atualizar produto
 *     tags: [Produtos]
 *     description: Atualiza um produto existente
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do produto
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
 *                 description: Nome do produto
 *               description:
 *                 type: string
 *                 description: Descrição do produto
 *               price:
 *                 type: number
 *                 format: float
 *                 minimum: 0.01
 *                 description: Preço do produto
 *               discount_price:
 *                 type: number
 *                 format: float
 *                 minimum: 0.01
 *                 description: Preço com desconto
 *               image_url:
 *                 type: string
 *                 format: uri
 *                 description: URL da imagem do produto
 *               category_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID da categoria
 *               serving_size:
 *                 type: string
 *                 description: Tamanho da porção
 *               preparation_time:
 *                 type: integer
 *                 description: Tempo de preparo em minutos
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Lista de ingredientes
 *               options:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     price:
 *                       type: number
 *                     required:
 *                       type: boolean
 *                 description: Opções do produto
 *               allergens:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Lista de alérgenos
 *               status:
 *                 type: string
 *                 enum: [active, inactive, out_of_stock]
 *                 description: Status do produto
 *               is_featured:
 *                 type: boolean
 *                 description: Produto em destaque
 *               slug:
 *                 type: string
 *                 description: Slug para URL amigável
 *     responses:
 *       200:
 *         description: Produto atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Produto atualizado com sucesso
 *                 product:
 *                   $ref: '#/components/schemas/Product'
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
 *         description: Produto não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', updateProduct);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Excluir produto
 *     tags: [Produtos]
 *     description: Exclui um produto existente
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do produto
 *     responses:
 *       200:
 *         description: Produto excluído com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Produto excluído com sucesso
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Produto não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', deleteProduct);

/**
 * @swagger
 * /products/{id}/status:
 *   patch:
 *     summary: Alterar status do produto
 *     tags: [Produtos]
 *     description: Altera o status de um produto existente
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do produto
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
 *                 enum: [active, inactive, out_of_stock]
 *                 description: Novo status do produto
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
 *                   example: Status do produto alterado para active
 *                 product:
 *                   $ref: '#/components/schemas/Product'
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
 *         description: Produto não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:id/status', changeProductStatus);

/**
 * @swagger
 * /products/{id}/featured:
 *   patch:
 *     summary: Destacar produto
 *     tags: [Produtos]
 *     description: Destaca ou remove destaque de um produto (requer plano premium)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do produto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - is_featured
 *             properties:
 *               is_featured:
 *                 type: boolean
 *                 description: Status de destaque (true para destacar, false para remover)
 *     responses:
 *       200:
 *         description: Status de destaque alterado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Produto destacado com sucesso
 *                 product:
 *                   $ref: '#/components/schemas/Product'
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
 *         description: Recurso não disponível no plano atual
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Acesso negado
 *                 message:
 *                   type: string
 *                 requiredFeature:
 *                   type: string
 *                 requiredPlan:
 *                   type: string
 *                 currentPlan:
 *                   type: string
 *                 upgrade:
 *                   type: boolean
 *       404:
 *         description: Produto não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:id/featured', checkFeatureAccessMiddleware('promotions'), toggleFeatured);

export default router;