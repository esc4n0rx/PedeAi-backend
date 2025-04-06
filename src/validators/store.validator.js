import { z } from 'zod';

export const storeSchema = z.object({
  name: z.string().min(3, "Nome da loja deve ter pelo menos 3 caracteres"),
  address: z.string().min(5, "Endereço deve ter pelo menos 5 caracteres"),
  neighborhood: z.string().min(2, "Bairro deve ser informado"),
  city: z.string().min(2, "Cidade deve ser informada"),
  logo_url: z.string().url("URL da logo inválida").optional(),
  banner_url: z.string().url("URL do banner inválida").optional(),
  theme: z.string().default("default"),
  payment_methods: z.array(z.string()).default(["dinheiro", "cartão"]),
  business_hours: z.record(z.string(), z.string()).optional()
});