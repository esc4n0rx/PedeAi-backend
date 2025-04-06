// src/routes/auth.routes.js
import { Router } from 'express';
import { loginUser } from "../controllers/login.controller.js";
import { refreshToken, handleLogout } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Autenticar usuário
 *     tags: [Autenticação]
 *     description: Realiza login do usuário e retorna token de acesso
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - senha
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email do usuário
 *               senha:
 *                 type: string
 *                 format: password
 *                 description: Senha do usuário
 *     responses:
 *       200:
 *         description: Login bem-sucedido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: Token JWT para autenticação
 *                 refreshToken:
 *                   type: string
 *                   description: Token para renovar o accessToken
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Credenciais inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', loginUser);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Renovar token de acesso
 *     tags: [Autenticação]
 *     description: Usa um refreshToken para obter um novo token de acesso
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Token de atualização obtido durante o login
 *     responses:
 *       200:
 *         description: Token renovado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: Novo token JWT para autenticação
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Token inválido ou expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/refresh-token', refreshToken);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Fazer logout
 *     tags: [Autenticação]
 *     description: Invalida o refreshToken atual
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Token de atualização a ser invalidado
 *     responses:
 *       200:
 *         description: Logout realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logout realizado com sucesso
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/logout', authMiddleware, handleLogout);

export default router;