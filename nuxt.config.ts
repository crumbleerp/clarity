export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui'],

  devtools: {
    enabled: true
  },

  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', href: '/favicon.png' }
      ]
    }
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    databaseUrl: process.env.NUXT_DATABASE_URL || process.env.DATABASE_URL || '',
    rootUsername: process.env.NUXT_ROOT_USERNAME || process.env.ROOT_USERNAME || 'admin',
    rootPassword: process.env.NUXT_ROOT_PASSWORD || process.env.ROOT_PASSWORD || 'admin',
    sessionSecret: process.env.NUXT_SESSION_SECRET || process.env.SESSION_SECRET || 'some-random-secret-at-least-32-chars-long',
    s3Endpoint: process.env.NUXT_S3_ENDPOINT || process.env.S3_ENDPOINT || '',
    s3Region: process.env.NUXT_S3_REGION || process.env.S3_REGION || 'us-east-1',
    s3Bucket: process.env.NUXT_S3_BUCKET || process.env.S3_BUCKET || '',
    s3AccessKey: process.env.NUXT_S3_ACCESS_KEY || process.env.S3_ACCESS_KEY || '',
    s3SecretKey: process.env.NUXT_S3_SECRET_KEY || process.env.S3_SECRET_KEY || '',
    s3PublicUrl: process.env.NUXT_S3_PUBLIC_URL || process.env.S3_PUBLIC_URL || '',
    public: {
      dataset: process.env.NUXT_PUBLIC_DATASET || process.env.DATASET || 'production',
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || process.env.BASE_URL || ''
    }
  },

  routeRules: {
    '/': { prerender: false }
  },

  compatibilityDate: '2025-01-15',

  nitro: {
    prerender: {
      routes: []
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
