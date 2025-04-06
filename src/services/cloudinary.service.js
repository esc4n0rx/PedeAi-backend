
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadImage = async (base64Image, folder) => {
  try {
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: `pedeai/${folder}`
    });
    
    return {
      url: result.secure_url,
      public_id: result.public_id
    };
  } catch (error) {
    console.error('Erro ao fazer upload para o Cloudinary:', error);
    throw new Error('Falha ao fazer upload da imagem');
  }
};

export const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar imagem do Cloudinary:', error);
    throw new Error('Falha ao deletar a imagem');
  }
};