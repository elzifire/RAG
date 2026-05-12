import { defineStore } from 'pinia'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const token = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const hydrated = ref(false)

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  // ── Persist token + user across page reloads ─────────────────────────────
  function hydrateFromStorage() {
    if (!import.meta.client) return
    const storedToken = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('auth_user')
    if (storedToken) token.value = storedToken
    if (storedUser) {
      try { user.value = JSON.parse(storedUser) }
      catch { localStorage.removeItem('auth_user') }
    }
    hydrated.value = true
  }

  function persistToken(t: string | null) {
    token.value = t
    if (import.meta.client) {
      if (t) localStorage.setItem('auth_token', t)
      else localStorage.removeItem('auth_token')
    }
  }

  function persistUser(u: AuthUser | null) {
    user.value = u
    if (import.meta.client) {
      if (u) localStorage.setItem('auth_user', JSON.stringify(u))
      else localStorage.removeItem('auth_user')
    }
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  async function login(email: string, password: string) {
    isLoading.value = true
    error.value = null
    try {
      const res = await $fetch<{ token: string; user: AuthUser }>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      })
      persistToken(res.token)
      persistUser(res.user)
      return true
    }
    catch (err: unknown) {
      error.value = (err as { data?: { message?: string } }).data?.message ?? 'Login failed'
      return false
    }
    finally {
      isLoading.value = false
    }
  }

  async function register(email: string, name: string, password: string) {
    isLoading.value = true
    error.value = null
    try {
      const res = await $fetch<{ token: string; user: AuthUser }>('/api/auth/register', {
        method: 'POST',
        body: { email, name, password },
      })
      persistToken(res.token)
      persistUser(res.user)
      return true
    }
    catch (err: unknown) {
      error.value = (err as { data?: { message?: string } }).data?.message ?? 'Registration failed'
      return false
    }
    finally {
      isLoading.value = false
    }
  }

  async function fetchMe() {
    if (!token.value) return false
    try {
      const res = await $fetch<AuthUser>('/api/auth/me', {
        headers: { Authorization: `Bearer ${token.value}` },
      })
      persistUser(res)
      return true
    }
    catch {
      persistToken(null)
      persistUser(null)
      return false
    }
  }

  async function loginWithNeonToken(accessToken: string) {
    isLoading.value = true
    error.value = null
    try {
      const res = await $fetch<{ token: string; user: AuthUser }>('/api/auth/neon/session', {
        method: 'POST',
        body: { accessToken },
      })
      persistToken(res.token)
      persistUser(res.user)
      return true
    }
    catch (err: unknown) {
      error.value = (err as { data?: { message?: string } }).data?.message ?? 'Neon login failed'
      return false
    }
    finally {
      isLoading.value = false
    }
  }

  function logout() {
    persistToken(null)
    persistUser(null)
    error.value = null
  }

  return {
    user,
    token,
    isLoading,
    error,
    isAuthenticated,
    hydrateFromStorage,
    persistToken,
    persistUser,
    login,
    register,
    loginWithNeonToken,
    fetchMe,
    logout,
  }
})
