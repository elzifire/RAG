import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../../../app/stores/auth'

// $fetch is stubbed globally by tests/setup.ts

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  // ── Initial state ───────────────────────────────────────────────────────────
  describe('initial state', () => {
    it('is not authenticated', () => {
      const store = useAuthStore()
      expect(store.isAuthenticated).toBe(false)
      expect(store.user).toBeNull()
      expect(store.token).toBeNull()
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  // ── login ───────────────────────────────────────────────────────────────────
  describe('login()', () => {
    it('returns true and sets token + user on success', async () => {
      vi.mocked($fetch as any).mockResolvedValueOnce({
        token: 'jwt-abc123',
        user: { id: 'u1', email: 'a@test.com', name: 'Alice', role: 'USER' },
      })

      const store = useAuthStore()
      const ok = await store.login('a@test.com', 'password123')

      expect(ok).toBe(true)
      expect(store.token).toBe('jwt-abc123')
      expect(store.user?.email).toBe('a@test.com')
      expect(store.isAuthenticated).toBe(true)
    })

    it('persists token and user to localStorage', async () => {
      vi.mocked($fetch as any).mockResolvedValueOnce({
        token: 'stored-token',
        user: { id: 'u1', email: 'a@test.com', name: 'Alice', role: 'USER' },
      })

      const store = useAuthStore()
      await store.login('a@test.com', 'pw')

      expect(localStorage.getItem('auth_token')).toBe('stored-token')
      const storedUser = JSON.parse(localStorage.getItem('auth_user')!)
      expect(storedUser.email).toBe('a@test.com')
    })

    it('returns false and sets error on failure', async () => {
      vi.mocked($fetch as any).mockRejectedValueOnce({
        data: { message: 'Invalid email or password' },
      })

      const store = useAuthStore()
      const ok = await store.login('wrong@test.com', 'wrong')

      expect(ok).toBe(false)
      expect(store.isAuthenticated).toBe(false)
      expect(store.error).toBe('Invalid email or password')
      expect(store.token).toBeNull()
    })

    it('resets isLoading to false after failure', async () => {
      vi.mocked($fetch as any).mockRejectedValueOnce(new Error('Network error'))

      const store = useAuthStore()
      await store.login('x@x.com', 'pw')

      expect(store.isLoading).toBe(false)
    })
  })

  // ── register ────────────────────────────────────────────────────────────────
  describe('register()', () => {
    it('returns true and sets token + user on success', async () => {
      vi.mocked($fetch as any).mockResolvedValueOnce({
        token: 'new-jwt',
        user: { id: 'u2', email: 'new@test.com', name: 'Bob', role: 'USER' },
      })

      const store = useAuthStore()
      const ok = await store.register('new@test.com', 'Bob', 'securepass1')

      expect(ok).toBe(true)
      expect(store.isAuthenticated).toBe(true)
      expect(store.user?.name).toBe('Bob')
    })

    it('returns false on failure', async () => {
      vi.mocked($fetch as any).mockRejectedValueOnce({
        data: { message: 'Email already registered' },
      })

      const store = useAuthStore()
      const ok = await store.register('dup@test.com', 'Dup', 'pass1234')

      expect(ok).toBe(false)
      expect(store.error).toBe('Email already registered')
    })
  })

  // ── logout ──────────────────────────────────────────────────────────────────
  describe('logout()', () => {
    it('clears user, token, and localStorage', async () => {
      // Simulate logged-in state
      const store = useAuthStore()
      store.persistUser({ id: 'u1', email: 'a@test.com', name: 'Alice', role: 'USER' })
      localStorage.setItem('auth_token', 'some-token')

      store.logout()

      expect(store.user).toBeNull()
      expect(store.token).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(localStorage.getItem('auth_token')).toBeNull()
      expect(localStorage.getItem('auth_user')).toBeNull()
    })
  })

  // ── hydrateFromStorage ──────────────────────────────────────────────────────
  describe('hydrateFromStorage()', () => {
    it('restores token and user from localStorage', () => {
      localStorage.setItem('auth_token', 'restored-token')
      localStorage.setItem('auth_user', JSON.stringify({ id: 'u1', email: 'a@test.com', name: 'Alice', role: 'USER' }))

      const store = useAuthStore()
      store.hydrateFromStorage()

      expect(store.token).toBe('restored-token')
      expect(store.user?.email).toBe('a@test.com')
      expect(store.isAuthenticated).toBe(true)
    })

    it('does not fail when storage is empty', () => {
      const store = useAuthStore()
      expect(() => store.hydrateFromStorage()).not.toThrow()
      expect(store.isAuthenticated).toBe(false)
    })

    it('handles corrupted auth_user JSON gracefully', () => {
      localStorage.setItem('auth_token', 'good-token')
      localStorage.setItem('auth_user', '{bad json:::}')

      const store = useAuthStore()
      expect(() => store.hydrateFromStorage()).not.toThrow()
      expect(store.token).toBe('good-token')
      expect(store.user).toBeNull()
    })
  })

  // ── persistUser ─────────────────────────────────────────────────────────────
  describe('persistUser()', () => {
    it('updates store and localStorage on set', () => {
      const store = useAuthStore()
      store.persistUser({ id: 'u1', email: 'a@test.com', name: 'Alice', role: 'USER' })

      expect(store.user?.name).toBe('Alice')
      expect(localStorage.getItem('auth_user')).toContain('Alice')
    })

    it('removes entry from localStorage on null', () => {
      localStorage.setItem('auth_user', '{"id":"u1","email":"a@test.com","name":"Alice","role":"USER"}')
      const store = useAuthStore()
      store.persistUser(null)

      expect(store.user).toBeNull()
      expect(localStorage.getItem('auth_user')).toBeNull()
    })
  })
})
