/**
 * Global test setup.
 * Stubs Nuxt/Nitro auto-imported globals so handler files can be imported
 * in the happy-dom environment without the full Nuxt runtime.
 */
import { vi, beforeEach } from 'vitest'
import { ref, computed, onMounted, watch, watchEffect, nextTick, reactive } from 'vue'
import { defineStore, setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../app/stores/auth'

// ── localStorage shim ─────────────────────────────────────────────────────────
// Node.js 26 defines localStorage as a configurable getter. We replace it with
// a plain Map-backed object so tests can use localStorage without --localstorage-file.
const _lsData = new Map<string, string>()
const _lsMock = {
  getItem: (k: string) => _lsData.get(k) ?? null,
  setItem: (k: string, v: string) => { _lsData.set(k, v) },
  removeItem: (k: string) => { _lsData.delete(k) },
  clear: () => _lsData.clear(),
  get length() { return _lsData.size },
  key: (i: number) => [..._lsData.keys()][i] ?? null,
} as Storage

try {
  Object.defineProperty(globalThis, 'localStorage', {
    value: _lsMock,
    writable: true,
    configurable: true,
    enumerable: true,
  })
} catch {
  // Fallback if Node already locked the descriptor
  ;(globalThis as any).localStorage = _lsMock
}

// ── Vue auto-imports ──────────────────────────────────────────────────────────
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('onMounted', onMounted)
vi.stubGlobal('watch', watch)
vi.stubGlobal('watchEffect', watchEffect)
vi.stubGlobal('nextTick', nextTick)
vi.stubGlobal('reactive', reactive)

// ── Pinia auto-import ─────────────────────────────────────────────────────────
vi.stubGlobal('defineStore', defineStore)

// ── Nuxt runtime mocks ────────────────────────────────────────────────────────
vi.stubGlobal('$fetch', vi.fn())
vi.stubGlobal('useRouter', vi.fn(() => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() })))
vi.stubGlobal('useRoute', vi.fn(() => ({ params: {}, query: {}, path: '/' })))
vi.stubGlobal('useRuntimeConfig', vi.fn(() => ({})))
vi.stubGlobal('navigateTo', vi.fn())
vi.stubGlobal('definePageMeta', vi.fn())
// useAuthStore is a Nuxt auto-import used by composables such as useApi.ts
vi.stubGlobal('useAuthStore', useAuthStore)

// ── Nitro/H3 auto-imports (server handler globals) ────────────────────────────
vi.stubGlobal('defineEventHandler', (fn: Function) => fn)
vi.stubGlobal('readBody', vi.fn())
vi.stubGlobal('createError', (opts: { statusCode: number; message: string }) => {
  const err = new Error(opts.message) as Error & { statusCode: number }
  err.statusCode = opts.statusCode
  return err
})
vi.stubGlobal('getRouterParam', vi.fn())
vi.stubGlobal('sendNoContent', vi.fn())

// ── Global Prisma mock (used by login, register, me handlers as Nitro auto-import) ──
vi.stubGlobal('prisma', {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  passkey: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    delete: vi.fn(),
  },
})

// ── Reset Pinia + clear localStorage + clear all mocks before each test ───────
beforeEach(() => {
  setActivePinia(createPinia())
  _lsData.clear()     // clear via internal Map — safe even when window.localStorage isn't reachable
  vi.clearAllMocks()
})
