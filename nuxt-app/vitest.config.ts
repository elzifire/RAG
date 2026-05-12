import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Vite plugin that replaces Nuxt's import.meta.client / import.meta.server
// with boolean literals so auth store guards work correctly in tests.
const nuxtMetaShim = {
  name: 'nuxt-meta-shim',
  transform(code: string) {
    if (!code.includes('import.meta.client') && !code.includes('import.meta.server')) return
    return {
      code: code
        .replace(/import\.meta\.client/g, 'true')
        .replace(/import\.meta\.server/g, 'false'),
      map: null,
    }
  },
}

export default defineConfig({
  plugins: [nuxtMetaShim],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
  define: {
    'import.meta.client': 'true',
    'import.meta.server': 'false',
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, './app'),
      '@': resolve(__dirname, './app'),
    },
  },
})
