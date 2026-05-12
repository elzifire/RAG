// Nuxt route middleware — redirects unauthenticated users to /login
export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return // auth is client-only (JWT in localStorage)

  const auth = useAuthStore()
  auth.hydrateFromStorage()

  if (!auth.isAuthenticated && to.path !== '/login') {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
