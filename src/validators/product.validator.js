import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(3, "Nome do produto deve ter pelo menos 3 caracteres"),
  description: z.string().optional(),
  price: z.number().positive("Preço deve ser positivo"),
  discount_price: z.number().positive("Preço com desconto deve ser positivo").optional(),
  image_url: z.string().url("URL da imagem inválida").optional(),
  category_id: z.string().uuid("ID de categoria inválido").optional(),
  serving_size: z.string().optional(),
  preparation_time: z.number().int().positive().optional(),
  ingredients: z.array(z.string()).optional(),
  options: z.array(
    z.object({
      name: z.string(),
      price: z.number().optional(),
      required: z.boolean().optional()
    })
  ).optional(),
  allergens: z.array(z.string()).optional(),
  status: z.enum(["active", "inactive", "out_of_stock"]).default("active"),
  is_featured: z.boolean().default(false),
  slug: z.string().optional()
});

export const productCategorySchema = z.object({
  name: z.string().min(2, "Nome da categoria deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  display_order: z.number().int().nonnegative().optional()
});