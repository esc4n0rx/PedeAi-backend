import { z } from 'zod';
import { uploadFile } from '../services/upload.service.js';

// Validação para upload de arquivo
const uploadSchema = z.object({
  file: z.string()
    .min(1, 'Arquivo é obrigatório')
    .refine(val => val.startsWith('data:'), {
      message: 'Formato de arquivo inválido. Deve ser uma string base64 começando com "data:"'
    }),
  folder: z.string().optional()
});

/**
 * Faz upload de um arquivo para o servidor
 * @param {Request} req - Requisição Express
 * @param {Response} res - Resposta Express
 * @param {NextFunction} next - Função next do Express
 */
export const uploadFileController = async (req, res, next) => {
  try {
    const { file, folder } = uploadSchema.parse(req.body);
    
    const result = await uploadFile(file, folder || 'payment_proofs');
    
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};