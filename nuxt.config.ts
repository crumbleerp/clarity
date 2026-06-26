export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    databaseUrl: '',
    dataset: '',
    rootUsername: 'admin',
    rootPassword: 'admin',
    sessionSecret: 'some-random-secret-at-least-32-chars-long',
    s3Endpoint: '',
    s3Region: 'us-east-1',
    s3Bucket: '',
    s3AccessKey: '',
    s3SecretKey: '',
    s3PublicUrl: '',
    public: {
      dataset: process.env.DATASET || 'production',
      apiBaseUrl: process.env.BASE_URL || ''
    }
  },

  routeRules: {
    '/': { prerender: true }
  },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
