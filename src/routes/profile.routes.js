// src/routes/profile.routes.js
import { Router } from 'express'
import { authMiddleware } from "../middlewares/authMiddleware.js"

const router = Router()

/**
 * @swagger
 * /perfil:
 *   get:
 *     summary: Obter perfil do usuário
 *     tags: [Usuários]
 *     description: Retorna os dados do perfil do usuário autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil do usuário
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Perfil do usuário autenticado
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       description: ID do usuário
 *                     nome:
 *                       type: string
 *                       description: Nome do usuário
 *                     email:
 *                       type: string
 *                       format: email
 *                       description: Email do usuário
 *                     cpf_cnpj:
 *                       type: string
 *                       description: CPF ou CNPJ do usuário (criptografado)
 *                     telefone:
 *                       type: string
 *                       description: Telefone do usuário
 *                     endereco:
 *                       type: string
 *                       description: Endereço do usuário
 *                     plan_active:
 *                       type: string
 *                       description: Plano ativo do usuário
 *                     plan_expire_at:
 *                       type: string
 *                       format: date-time
 *                       description: Data de expiração do plano
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', authMiddleware, (req, res) => {
  const user = req.user
  res.json({ message: 'Perfil do usuário autenticado', user })
})

export default router