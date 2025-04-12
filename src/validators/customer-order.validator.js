// src/validators/customer-order.validator.js
import { z } from 'zod';

// Schema para identificação inicial do cliente (etapa 1)
export const customerIdentificationSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos")
    .refine(val => /^[0-9]+$/.test(val), {
      message: "Telefone deve conter apenas números"
    })
});

// Schema para endereço de entrega
export const deliveryAddressSchema = z.object({
  street: z.string().min(3, "Rua deve ter pelo menos 3 caracteres"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, "Bairro é obrigatório"),
  city: z.string().min(2, "Cidade é obrigatória"),
  zip_code: z.string().min(5, "CEP é obrigatório")
    .refine(val => /^[0-9-]+$/.test(val), {
      message: "CEP deve conter apenas números e hífen"
    }),
  reference_point: z.string().optional()
});

// Schema para pedido completo
export const customerOrderSchema = z.object({
  customer: customerIdentificationSchema,
  address: deliveryAddressSchema,
  items: z.array(
    z.object({
      product_id: z.string().uuid("ID do produto inválido"),
      quantity: z.number().int().positive("Quantidade deve ser um número positivo"),
      notes: z.string().optional(),
      options: z.array(
        z.object({
          option_id: z.string().uuid("ID da opção inválido"),
          name: z.string(),
          price: z.number().optional()
        })
      ).optional()
    })
  ).min(1, "O pedido deve ter pelo menos um item"),
  payment_method: z.enum(["pix", "cartao", "dinheiro"], {
    errorMap: () => ({ message: "Método de pagamento deve ser pix, cartao ou dinheiro" })
  }),
  change_for: z.number().optional(),
  coupon_code: z.string().optional(),
  notes: z.string().optional(),
  device_info: z.object({
    device_id: z.string().optional(),
    platform: z.string().optional(),
    browser: z.string().optional()
  }).optional()
});