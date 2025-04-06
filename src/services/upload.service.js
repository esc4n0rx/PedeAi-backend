import { v4 as uuidv4 } from 'uuid';
import { v2 as cloudinary } from 'cloudinary';

/**
 * Faz upload de um arquivo para o Cloudinary
 * @param {string} base64String - Arquivo em formato base64
 * @param {string} folder - Pasta no Cloudinary
 * @returns {Promise<Object>} Objeto com URL e ID público do arquivo
 */
export async function uploadFile(base64String, folder = 'payment_proofs') {
  if (!base64String) {
    throw new Error('Arquivo não fornecido');
  }

  try {
    // Gerar um ID único para o arquivo
    const publicId = `${folder}/${uuidv4()}`;
    
    // Fazer upload para o Cloudinary
    const result = await cloudinary.uploader.upload(base64String, {
      public_id: publicId,
      folder: 'pedeai', // Pasta principal
      resource_type: 'auto' // Detectar tipo automaticamente
    });
    
    return {
      url: result.secure_url,
      public_id: result.public_id
    };
  } catch (error) {
    console.error('Erro ao fazer upload do arquivo:', error);
    throw new Error('Falha ao fazer upload do arquivo para o servidor');
  }
}

/**
 * Deleta um arquivo do Cloudinary
 * @param {string} publicId - ID público do arquivo
 * @returns {Promise<boolean>} Sucesso da operação
 */
export async function deleteFile(publicId) {
  if (!publicId) {
    return false;
  }
  
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error('Erro ao excluir arquivo:', error);
    return false;
  }
}