// src/utils/encryption.js
import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';

dotenv.config();

const SECRET_KEY = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || '';

export function encrypt(text) {
  if (!SECRET_KEY) {
    throw new Error('Chave de criptografia não definida');
  }
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
}

export function decrypt(ciphertext) {
  if (!SECRET_KEY) {
    throw new Error('Chave de criptografia não definida');
  }
  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}