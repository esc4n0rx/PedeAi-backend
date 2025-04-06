import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { uploadFileController } from '../controllers/upload.controller.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Fazer upload de arquivo
 *     tags: [Upload]
 *     description: Faz upload de um arquivo base64 para o servidor
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: byte
 *                 description: Arquivo em formato base64
 *               folder:
 *                 type: string
 *                 description: Pasta para armazenar o arquivo (opcional)
 *     responses:
 *       200:
 *         description: Upload realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   format: uri
 *                   description: URL do arquivo
 *                 public_id:
 *                   type: string
 *                   description: ID público do arquivo
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
 */
router.post('/', uploadFileController);

export default router;