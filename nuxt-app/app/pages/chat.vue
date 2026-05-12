<script setup lang="ts">

// Chat page is client-only: DOMPurify requires DOM, SSR not needed for chatbot UX
definePageMeta({ ssr: false, middleware: ['auth'] })

const store = useChatStore()
const auth = useAuthStore()
const router = useRouter()
const { init: initTheme } = useTheme()

// Mobile sidebar toggle
const sidebarOpen = ref(false)

onMounted(async () => {
  initTheme()
  auth.hydrateFromStorage()
  if (!auth.isAuthenticated) return

  // Validate token is still good, then load data
  const valid = await auth.fetchMe()
  if (!valid) {
    router.replace('/login')
    return
  }
  await Promise.all([store.fetchModels(), store.fetchSessions()])
})

async function handleNewChatFromEmpty() {
  sidebarOpen.value = false
  await store.createSession()
}

function logout() {
  auth.logout()
  store.clearAll()
  router.replace('/login')
}
</script>

<template>
  <div class="flex h-[100dvh] overflow-hidden bg-base-200/50 md:p-4 lg:p-6 relative">
    
    <!-- Outer Application Card for Desktop -->
    <div class="flex flex-1 overflow-hidden bg-base-100 md:rounded-3xl md:shadow-2xl md:border md:border-base-200/60 transition-all duration-300 relative">

      <!-- ── Mobile sidebar overlay ──────────────────────────────── -->
      <Transition name="fade">
        <div
          v-if="sidebarOpen"
          class="fixed inset-0 z-40 bg-base-content/20 backdrop-blur-sm md:hidden"
          @click="sidebarOpen = false"
        />
      </Transition>

      <!-- ── Sidebar ─────────────────────────────────────────────── -->
      <Transition name="slide">
        <div
          class="fixed md:relative inset-y-0 left-0 z-50 w-72 flex-shrink-0 md:flex border-r border-base-200/60 bg-base-100 shadow-xl md:shadow-none"
          :class="sidebarOpen ? 'flex' : 'hidden md:flex'"
        >
          <ChatSidebar class="w-full" @close="sidebarOpen = false" />
        </div>
      </Transition>

      <!-- ── Main area ───────────────────────────────────────────── -->
      <main class="flex-1 flex flex-col min-w-0 min-h-0 bg-base-100/50 relative">

        <!-- Mobile top bar -->
        <div class="flex items-center gap-3 px-4 py-3 bg-base-100/80 backdrop-blur-md border-b border-base-200 md:hidden shrink-0 sticky top-0 z-10">
          <button
            class="btn btn-ghost btn-sm btn-square hover:bg-base-200/50"
            aria-label="Open sidebar"
            @click="sidebarOpen = true"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span class="font-semibold text-sm truncate flex-1 tracking-tight">
            {{ store.activeSession?.name ?? 'RAG Chat' }}
          </span>
          <!-- Admin Panel button (mobile) -->
          <NuxtLink
            v-if="auth.user?.role === 'ADMIN'"
            to="/admin"
            class="btn btn-ghost btn-sm btn-square text-warning hover:bg-warning/10"
            aria-label="Admin Panel"
            title="Admin Panel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
            </svg>
          </NuxtLink>
          <button class="btn btn-ghost btn-sm btn-square text-error hover:bg-error/10 hover:border-error" aria-label="Logout" title="Logout" @click="logout">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>

        <!-- Global error banner -->
        <Transition name="fade">
          <div
            v-if="store.globalError"
            class="alert alert-error rounded-xl m-4 py-3 px-4 text-sm flex items-center gap-3 shadow-lg z-20 shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span class="font-medium">{{ store.globalError }}</span>
            <button class="btn btn-ghost btn-xs btn-square ml-auto hover:bg-error-content/20" @click="store.globalError = null">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </Transition>

        <!-- Chat window or landing empty state -->
        <div class="flex-1 min-h-0 overflow-hidden relative z-0">
          <ChatWindow v-if="store.activeSessionId" />
          <ChatEmptyState
            v-else
            @new-chat="handleNewChatFromEmpty"
            @use-prompt="async (p) => { await store.createSession(); }"
          />
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-enter-active, .slide-leave-active { transition: transform 0.25s ease; }
.slide-enter-from, .slide-leave-to { transform: translateX(-100%); }
</style>
