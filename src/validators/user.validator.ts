// src/validators/user.validator.ts
import { z } from 'zod'

export const registerSchema = z.object({
  nome: z.string().min(3),
  email: z.string().email(),
  senha: z.string().min(6),
  cpf_cnpj: z.string().min(11).max(18),
  telefone: z.string().optional(),
  endereco: z.string().optional()
})

export type RegisterInput = z.infer<typeof registerSchema>
