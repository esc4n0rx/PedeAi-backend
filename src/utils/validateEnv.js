import dotenv from 'dotenv'

dotenv.config()


export function validateEnv() {
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_KEY',
      'JWT_SECRET',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
      throw new Error(`Variáveis de ambiente necessárias não definidas: ${missingEnvVars.join(', ')}`);
    }
  }