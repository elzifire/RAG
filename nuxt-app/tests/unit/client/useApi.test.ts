import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../../../app/stores/auth'
import { useApi } from '../../../app/composables/useApi'

describe('useApi', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  const setupAuth = () => {
    const auth = useAuthStore()
    auth.persistUser({ id: 'u1', email: 'a@test.com', name: 'Alice', role: 'USER' })
    // set token directly (persistToken is internal; use localStorage trick)
    localStorage.setItem('auth_token', 'bearer-token-xyz')
    auth.hydrateFromStorage()
    return auth
  }

  // ── get() ───────────────────────────────────────────────────────────────────
  describe('get()', () => {
    it('makes a GET request with Authorization header', async () => {
      setupAuth()
      vi.mocked($fetch as any).mockResolvedValueOnce({ data: 'ok' })

      const api = useApi()
      await api.get('/api/test')

      const [url, opts] = vi.mocked($fetch as any).mock.calls[0]
      expect(url).toBe('/api/test')
      expect(opts.headers.Authorization).toBe('Bearer bearer-token-xyz')
      expect(opts.method).toBeUndefined()
    })

    it('works without a token (no Authorization header)', async () => {
      vi.mocked($fetch as any).mockResolvedValueOnce({})

      const api = useApi()
      await api.get('/api/public')

      const [, opts] = vi.mocked($fetch as any).mock.calls[0]
      expect(opts.headers.Authorization).toBeUndefined()
    })
  })

  // ── post() ──────────────────────────────────────────────────────────────────
  describe('post()', () => {
    it('makes a POST request with body and Authorization header', async () => {
      setupAuth()
      vi.mocked($fetch as any).mockResolvedValueOnce({ token: 'new-token' })

      const api = useApi()
      await api.post('/api/auth/login', { email: 'a@test.com', password: 'pw' })

      const [url, opts] = vi.mocked($fetch as any).mock.calls[0]
      expect(url).toBe('/api/auth/login')
      expect(opts.method).toBe('POST')
      expect(opts.body).toEqual({ email: 'a@test.com', password: 'pw' })
    })
  })

  // ── patch() ─────────────────────────────────────────────────────────────────
  describe('patch()', () => {
    it('makes a PATCH request with body and Authorization header', async () => {
      setupAuth()
      vi.mocked($fetch as any).mockResolvedValueOnce({ name: 'Updated' })

      const api = useApi()
      await api.patch('/api/auth/profile', { name: 'Updated' })

      const [url, opts] = vi.mocked($fetch as any).mock.calls[0]
      expect(url).toBe('/api/auth/profile')
      expect(opts.method).toBe('PATCH')
      expect(opts.body).toEqual({ name: 'Updated' })
      expect(opts.headers.Authorization).toBe('Bearer bearer-token-xyz')
    })
  })

  // ── del() ───────────────────────────────────────────────────────────────────
  describe('del()', () => {
    it('makes a DELETE request with Authorization header', async () => {
      setupAuth()
      vi.mocked($fetch as any).mockResolvedValueOnce({ success: true })

      const api = useApi()
      await api.del('/api/auth/passkeys/pk-1')

      const [url, opts] = vi.mocked($fetch as any).mock.calls[0]
      expect(url).toBe('/api/auth/passkeys/pk-1')
      expect(opts.method).toBe('DELETE')
      expect(opts.headers.Authorization).toBe('Bearer bearer-token-xyz')
    })
  })

  // ── sseUrl() ────────────────────────────────────────────────────────────────
  describe('sseUrl()', () => {
    it('appends token as query param', () => {
      setupAuth()

      const api = useApi()
      const url = api.sseUrl('/api/chat/stream/session-1')

      expect(url).toBe('/api/chat/stream/session-1?token=bearer-token-xyz')
    })

    it('appends token after existing query params', () => {
      setupAuth()

      const api = useApi()
      const url = api.sseUrl('/api/chat/stream/session-1?model=llama3')

      expect(url).toBe('/api/chat/stream/session-1?model=llama3&token=bearer-token-xyz')
    })

    it('returns plain URL when not authenticated', () => {
      const api = useApi()
      const url = api.sseUrl('/api/chat/stream/session-1')

      expect(url).toBe('/api/chat/stream/session-1')
    })
  })

  // ── authHeaders() ───────────────────────────────────────────────────────────
  describe('authHeaders()', () => {
    it('returns Authorization header when token exists', () => {
      setupAuth()

      const api = useApi()
      expect(api.authHeaders()).toEqual({ Authorization: 'Bearer bearer-token-xyz' })
    })

    it('returns empty object when no token', () => {
      const api = useApi()
      expect(api.authHeaders()).toEqual({})
    })
  })
})
