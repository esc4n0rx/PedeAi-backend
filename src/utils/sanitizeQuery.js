export function sanitizeQueryParam(param) {
  return param.replace(/[;'"\\]/g, '');
}