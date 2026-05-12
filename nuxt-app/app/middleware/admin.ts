export default defineNuxtRouteMiddleware(() => {
  const auth = useAuthStore()
  if (!auth.isAuthenticated || auth.user?.role !== 'ADMIN') {
    return navigateTo('/login')
  }
})
