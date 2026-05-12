// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt', '@vueuse/nuxt'],

  css: ['~/assets/css/main.css'],

  tailwindcss: {
    configPath: '~/tailwind.config.ts',
  },

  vite: {
    optimizeDeps: {
      include: ['dompurify', 'marked'],
    },
  },

  runtimeConfig: {
    redisHost: process.env.REDIS_HOST || '127.0.0.1',
    redisPort: process.env.REDIS_PORT || '6379',
    redisPassword: process.env.REDIS_PASSWORD || '',
    ollamaApiUrl: process.env.OLLAMA_API_URL || '',
    databaseName: process.env.DATABASE_NAME || 'ragdb',
    databaseUser: process.env.DATABASE_USER || 'postgres',
    databasePassword: process.env.DATABASE_PASSWORD || '',
    databaseHost: process.env.DATABASE_HOST || 'localhost',
    databasePort: process.env.DATABASE_PORT || '5432',
    jwtSecret: process.env.JWT_SECRET || 'change_me_in_production_min_32_chars!!',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    openaiApiBaseUrl: process.env.GROQ_API_BASE_URL || 'https://api.groq.com/openai/v1',
    openaiApiKey: process.env.GROQ_API_KEY || '',
    openaiModel: process.env.GROQ_MODEL || process.env.OPENAI_MODEL || 'llama-3.1-8b-instant',
    // expose origin to client for WebAuthn rpID
    public: {
      appOrigin: process.env.APP_ORIGIN || 'http://localhost:3000',
    },
  },
})
