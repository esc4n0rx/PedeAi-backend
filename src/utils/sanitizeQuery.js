// src/utils/sanitizeQuery.js
export function sanitizeQueryParam(param) {
  // Remover caracteres potencialmente perigosos
  return param.replace(/[;'"\\]/g, '');
}