// vitest.config.js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['dotenv/config'],
    // Isso ajuda com resolução de módulos
    resolve: {
      // Alias para os módulos problemáticos
      alias: {
        'crypto-js': 'crypto-js'
      }
    }
  }
})