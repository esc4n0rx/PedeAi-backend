import { z } from 'zod';

// Validação de endereço
export const addressSchema = z.object({
  street: z.string().min(3, "Rua é obrigatória e deve ter pelo menos 3 caracteres"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, "Bairro é obrigatório"),
  city: z.string().min(2, "Cidade é obrigatória"),
  zip_code: z.string().min(5, "CEP é obrigatório"),
  reference_point: z.string().optional()
});

// Validação de cliente
export const customerSchema = z.object({
  name: z.string().min(3, "Nome é obrigatório e deve ter pelo menos 3 caracteres"),
  phone: z.string().min(10, "Telefone é obrigatório e deve ter pelo menos 10 dígitos"),
  email: z.string().email("Email inválido").optional()
});

// Validação dos itens do pedido
export const orderItemSchema = z.object({
  product_id: z.string().uuid("ID do produto inválido"),
  quantity: z.number().int().positive("Quantidade deve ser um número positivo"),
  notes: z.string().optional()
});

// Validação do pedido completo
export const orderSchema = z.object({
  customer: customerSchema,
  address: addressSchema,
  items: z.array(orderItemSchema).min(1, "O pedido deve ter pelo menos um item"),
  coupon_code: z.string().optional(),
  payment_method: z.enum(["pix", "cartao", "dinheiro"], {
    errorMap: () => ({ message: "Método de pagamento deve ser pix, cartao ou dinheiro" })
  }),
  change_for: z.number().optional(),
  notes: z.string().optional()
});

// Validação para atualização de status do pedido
export const orderStatusUpdateSchema = z.object({
  status: z.enum(["em_processamento", "em_preparacao", "em_rota", "finalizado", "cancelado", "recusado"], {
    errorMap: () => ({ message: "Status inválido" })
  }),
  notes: z.string().optional()
});

// Validação para comprovante de pagamento (Pix)
export const paymentProofSchema = z.object({
  payment_proof_url: z.string().url("URL de comprovante inválida")
});