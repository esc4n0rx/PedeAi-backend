// src/routes/register.routes.js
import { Router } from 'express'
import { registerUser } from "../controllers/register.controller.js"

const router = Router()

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Registrar novo usuário
 *     tags: [Usuários]
 *     description: Cria um novo usuário no sistema
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - email
 *               - senha
 *               - cpf_cnpj
 *             properties:
 *               nome:
 *                 type: string
 *                 minLength: 3
 *                 description: Nome completo do usuário
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email do usuário (único)
 *               senha:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 description: Senha do usuário
 *               cpf_cnpj:
 *                 type: string
 *                 minLength: 11
 *                 maxLength: 18
 *                 description: CPF ou CNPJ do usuário
 *               telefone:
 *                 type: string
 *                 description: Telefone de contato
 *               endereco:
 *                 type: string
 *                 description: Endereço do usuário
 *     responses:
 *       201:
 *         description: Usuário registrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Usuário registrado com sucesso
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email ou CPF/CNPJ já cadastrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', registerUser)

export default router