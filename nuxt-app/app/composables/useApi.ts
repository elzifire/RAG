/**
 * Authenticated $fetch wrapper.
 * Automatically attaches the Bearer token from the auth store.
 */
export function useApi() {
  const auth = useAuthStore()

  function authHeaders(): Record<string, string> {
    if (auth.token) {
      return { Authorization: `Bearer ${auth.token}` }
    }
    return {}
  }

  async function get<T>(url: string, opts?: Parameters<typeof $fetch>[1]): Promise<T> {
    return $fetch<T>(url, {
      ...opts,
      headers: { ...authHeaders(), ...(opts?.headers as Record<string, string> ?? {}) },
    })
  }

  async function post<T>(url: string, body: unknown, opts?: Parameters<typeof $fetch>[1]): Promise<T> {
    return $fetch<T>(url, {
      method: 'POST',
      body,
      ...opts,
      headers: { ...authHeaders(), ...(opts?.headers as Record<string, string> ?? {}) },
    })
  }

  async function patch<T>(url: string, body: unknown, opts?: Parameters<typeof $fetch>[1]): Promise<T> {
    return $fetch<T>(url, {
      method: 'PATCH',
      body,
      ...opts,
      headers: { ...authHeaders(), ...(opts?.headers as Record<string, string> ?? {}) },
    })
  }

  async function del<T>(url: string, opts?: Parameters<typeof $fetch>[1]): Promise<T> {
    return $fetch<T>(url, {
      method: 'DELETE',
      ...opts,
      headers: { ...authHeaders(), ...(opts?.headers as Record<string, string> ?? {}) },
    })
  }

  /** SSE URL with token as query param (EventSource can't send headers) */
  function sseUrl(path: string): string {
    if (auth.token) {
      const sep = path.includes('?') ? '&' : '?'
      return `${path}${sep}token=${encodeURIComponent(auth.token)}`
    }
    return path
  }

  return { get, post, patch, del, sseUrl, authHeaders }
}
