// src/utils/sanitize.js
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Criar window virtual para DOMPurify
const window = new JSDOM('').window;
const purify = DOMPurify(window);

// Sanitizar string
export const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return str;
  return purify.sanitize(str, { ALLOWED_TAGS: [] }).trim();
};

// Sanitizar objeto completo recursivamente
export const sanitizeData = (data) => {
  if (!data) return data;
  
  if (typeof data === 'string') {
    return sanitizeString(data);
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }
  
  if (typeof data === 'object' && data !== null) {
    const result = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = sanitizeData(data[key]);
      }
    }
    return result;
  }
  
  return data;
};